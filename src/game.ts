import DataBus from "./databus";
import { getScreenInfo } from '../mytsglib/core/utils/screen/screenUtils';
import
{
    checkCollision,
    getDistanceToStop,
    calculateScore,
    updateBrakeThickness,
    randomRange,
    clamp,
    lerp
} from './utils/index';

// 获取画布和上下文
const canvas = wx.createCanvas();
const ctx = canvas.getContext( '2d' );

// 获取 DataBus 实例
const databus = DataBus;

class Game
{
    private lastTime: number = 0;
    private obstacleCount: number = 4;
    private safeZone: number = 600;
    private steerSpeed: number = 4;
    private cameraFollowRatio: number = 0.75;

    constructor ()
    {
        console.log( '游戏初始化' );
        this.resetGame();
        this.gameLoop();
        wx.onTouchStart( ( e ) =>
        {
            if ( !databus.state.isPlaying || databus.state.isGameOver )
            {
                // 重新开始游戏
                this.resetGame();
                this.start();
            }
            this.start();
            const touchX = e.touches[ 0 ].clientX;
            const screenWidth = wx.getSystemInfoSync().screenWidth;

            if ( touchX < screenWidth * 0.3 )
            {
                // 左侧转向
                databus.setInput( { steerDirection: -1 } );
            } else if ( touchX > screenWidth * 0.7 )
            {
                // 右侧转向
                databus.setInput( { steerDirection: 1 } );
            } else
            {
                // 中间刹车
                databus.setInput( { isBraking: true } );
            }
        } );
        wx.onTouchEnd( () =>
        {
            // 释放所有控制
            databus.setInput( { isBraking: false, steerDirection: 0 } );
        } );

        wx.onTouchCancel( () =>
        {
            // 释放所有控制
            databus.setInput( { isBraking: false, steerDirection: 0 } );
        } );
    }
    /**
     * 重置游戏
     */
    public resetGame (): void
    {
        const info = getScreenInfo();
        databus.initConfig( info.width, info.height );
        databus.resetGame();

        // 生成障碍物
        this.generateObstacles();
    }

    /**
     * 开始游戏
     */
    public start (): void
    {
        if ( databus.state.isPlaying ) return;

        databus.updateState( {
            isPlaying: true,
            isGameOver: false,
            endReason: null
        } );

        // 重置车辆位置
        databus.car.y = 0;
        databus.car.x = databus.config.WIDTH / 2 - databus.car.width / 2;
        databus.car.speed = 0;
        databus.camera.y = 0;
        databus.camera.targetY = 0;
    }

    /**
     * 暂停游戏
     */
    public pause (): void
    {
        databus.updateState( { isPlaying: false } );
    }

    /**
     * 生成障碍物
     */
    private generateObstacles (): void
    {
        databus.obstacles = [];

        for ( let i = 0; i < this.obstacleCount; i++ )
        {
            const y = randomRange( this.safeZone, databus.config.STOP_LINE_Y - this.safeZone );
            const isLeft = Math.random() > 0.5;
            const laneCenter = databus.config.WIDTH / 2;
            const roadEdge = 60;

            databus.obstacles.push( {
                id: `obs_${ i }`,
                type: 'pedestrian',
                x: isLeft ?
                    randomRange( 20, laneCenter - roadEdge ) :
                    randomRange( laneCenter + roadEdge, databus.config.WIDTH - 60 ),
                y: y,
                width: 40,
                height: 40,
                active: true,
                speedX: ( Math.random() - 0.5 ) * 1.5
            } );
        }
    }

    /**
     * 更新逻辑
     */
    private update ( dt: number ): void
    {
        if ( !databus.state.isPlaying || databus.state.isGameOver ) return;

        // 1. 更新车辆物理
        this.updateCarPhysics( dt );

        // 2. 更新障碍物
        this.updateObstacles( dt );

        // 3. 更新相机
        this.updateCamera();

        // 4. 碰撞检测
        this.checkCollisions();

        // 5. 胜负判定
        this.checkWinCondition();
    }

    /**
     * 更新车辆物理
     */
    private updateCarPhysics ( dt: number ): void
    {
        const { input, state, car } = databus;

        // 刹车逻辑
        if ( input.isBraking && state.brakePadThickness > 0 )
        {
            car.speed = Math.max( 0, car.speed - car.brakeForce );
            databus.updateState( {
                brakePadThickness: updateBrakeThickness( state.brakePadThickness, true )
            } );
        } else
        {
            // 自动加速
            if ( car.speed < car.maxSpeed )
            {
                car.speed += 0.15;
            }
        }

        // 转向逻辑
        if ( input.steerDirection !== 0 && car.speed > 0 )
        {
            const moveAmount = input.steerDirection * this.steerSpeed * ( car.speed / car.maxSpeed );
            car.x = clamp(
                car.x + moveAmount,
                10,
                databus.config.WIDTH - car.width - 10
            );
        }

        // 移动车辆
        car.y += car.speed;

        // 更新到停止线的距离
        const dist = getDistanceToStop( car, databus.config );
        databus.updateState( { distanceToStop: dist } );

        // 检查刹车片是否耗尽
        if ( state.brakePadThickness <= 0 && input.isBraking )
        {
            this.gameOver( 'brake_worn_out' );
        }
    }

    /**
     * 更新障碍物
     */
    private updateObstacles ( dt: number ): void
    {
        databus.obstacles.forEach( obs =>
        {
            if ( obs.type === 'pedestrian' && obs.speedX )
            {
                obs.x += obs.speedX;
                // 碰到边缘反弹
                if ( obs.x <= 10 || obs.x + obs.width >= databus.config.WIDTH - 10 )
                {
                    obs.speedX *= -1;
                }
            }
        } );
    }

    /**
     * 更新相机
     */
    private updateCamera (): void
    {
        // 目标相机位置：保持车辆在屏幕下方 75% 处
        const targetY = databus.car.y - ( databus.config.HEIGHT * this.cameraFollowRatio );
        databus.camera.targetY = Math.max( databus.camera.targetY, targetY );

        // 平滑移动相机
        databus.camera.y = lerp( databus.camera.y, databus.camera.targetY, 0.1 );
    }

    /**
     * 检测碰撞
     */
    private checkCollisions (): void
    {
        const carRect = {
            x: databus.car.x + 8,
            y: databus.car.y + 5,
            width: databus.car.width - 16,
            height: databus.car.height - 10
        };

        for ( const obs of databus.obstacles )
        {
            const obsRect = {
                x: obs.x,
                y: obs.y,
                width: obs.width,
                height: obs.height
            };

            if ( checkCollision( carRect, obsRect ) )
            {
                this.gameOver( 'crash_pedestrian' );
                return;
            }
        }
    }

    /**
     * 检查胜利条件
     */
    private checkWinCondition (): void
    {
        const dist = databus.state.distanceToStop;

        // 车辆静止且在线内或略过
        if ( databus.car.speed === 0 && Math.abs( dist ) < 600 )
        {
            const score = calculateScore( dist );
            databus.updateState( { score } );
            this.gameOver( score > 0 ? 'win' : 'overshoot' );
            return;
        }

        // 严重冲过终点
        if ( dist < -400 )
        {
            this.gameOver( 'overshoot' );
        }
    }

    /**
     * 游戏结束
     */
    private gameOver ( reason: any ): void
    {
        databus.updateState( {
            isPlaying: false,
            isGameOver: true,
            endReason: reason
        } );

        console.log( `游戏结束: ${ reason }, 得分: ${ databus.state.score }` );
    }

    /**
     * 将世界坐标转换为屏幕坐标
     */
    private worldToScreenY ( worldY: number ): number
    {
        return worldY - databus.camera.y;
    }

    /**
     * 渲染游戏
     */
    private render (): void
    {
        // 清空画布
        ctx.clearRect( 0, 0, databus.config.WIDTH, databus.config.HEIGHT );

        // 渲染游戏场景
        this.renderGame();

        // 渲染UI
        this.renderUI();
    }

    /**
     * 渲染游戏场景
     */
    private renderGame (): void
    {
        const { config, camera } = databus;

        // 1. 绘制背景
        ctx.fillStyle = config.BACKGROUND_COLOR;
        ctx.fillRect( 0, 0, config.WIDTH, config.HEIGHT );

        // 2. 绘制道路边线
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo( 10, 0 ); ctx.lineTo( 10, config.HEIGHT );
        ctx.moveTo( config.WIDTH - 10, 0 ); ctx.lineTo( config.WIDTH - 10, config.HEIGHT );
        ctx.stroke();

        // 3. 绘制车道虚线（带移动效果）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash( [ 30, 40 ] );
        ctx.lineDashOffset = -( camera.y % 70 );
        ctx.beginPath();
        ctx.moveTo( config.WIDTH / 2, -70 );
        ctx.lineTo( config.WIDTH / 2, config.HEIGHT + 70 );
        ctx.stroke();
        ctx.setLineDash( [] );

        // 4. 绘制斑马线
        const zebraStartY = this.worldToScreenY( config.ZEBRA_START_Y );
        const zebraEndY = this.worldToScreenY( config.ZEBRA_END_Y );

        if ( zebraStartY < config.HEIGHT )
        {
            ctx.fillStyle = '#ecf0f1';
            for ( let y = config.ZEBRA_START_Y; y < config.ZEBRA_END_Y; y += 40 )
            {
                const screenY = this.worldToScreenY( y );
                if ( screenY > -20 && screenY < config.HEIGHT + 20 )
                {
                    ctx.fillRect( 20, screenY, config.WIDTH - 40, 20 );
                }
            }
        }

        // 5. 绘制停止线
        const stopLineY = this.worldToScreenY( config.STOP_LINE_Y );
        if ( stopLineY > -50 && stopLineY < config.HEIGHT + 50 )
        {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect( 15, stopLineY - 12, config.WIDTH - 30, 12 );

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText( 'STOP', config.WIDTH / 2, stopLineY - 25 );
        }

        // 6. 绘制障碍物
        databus.obstacles.forEach( obs =>
        {
            const screenY = this.worldToScreenY( obs.y );
            if ( screenY > -50 && screenY < config.HEIGHT + 50 )
            {
                if ( databus.assets.pedestrian )
                {
                    ctx.drawImage(
                        databus.assets.pedestrian,
                        obs.x,
                        screenY,
                        obs.width,
                        obs.height
                    );
                } else
                {
                    // 备用绘制
                    ctx.fillStyle = '#e67e22';
                    ctx.fillRect( obs.x, screenY, obs.width, obs.height );
                }
            }
        } );

        // 7. 绘制车辆
        this.renderCar();
    }

    /**
     * 渲染车辆
     */
    private renderCar (): void
    {
        const { car, input, camera, config } = databus;
        const screenY = this.worldToScreenY( car.y );

        ctx.save();
        ctx.translate( car.x + car.width / 2, screenY + car.height / 2 );

        // 转向倾斜效果
        const tiltAngle = input.steerDirection * 0.08 * ( car.speed / car.maxSpeed );
        ctx.rotate( tiltAngle );

        if ( databus.assets.car )
        {
            ctx.drawImage(
                databus.assets.car,
                -car.width / 2,
                -car.height / 2,
                car.width,
                car.height
            );
        } else
        {
            // 备用绘制
            ctx.fillStyle = '#9b59b6';
            ctx.fillRect( -car.width / 2, -car.height / 2, car.width, car.height );
        }

        // 刹车灯效果
        if ( input.isBraking )
        {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'red';
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc( -16, car.height / 2 - 2, 4, 0, Math.PI * 2 );
            ctx.arc( 16, car.height / 2 - 2, 4, 0, Math.PI * 2 );
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    /**
     * 渲染UI
     */
    private renderUI (): void
    {
        const { state, config } = databus;

        // 1. 速度显示
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText( `速度: ${ databus.car.speed.toFixed( 1 ) }`, 10, 30 );

        // 2. 距离显示
        const distance = state.distanceToStop;
        let distanceText = distance > 0 ?
            `距离停止线: ${ Math.round( distance ) }米` :
            `已过线: ${ Math.round( -distance ) }米`;
        ctx.fillText( distanceText, 10, 55 );

        // 3. 刹车片状态
        const brakePercent = Math.round( state.brakePadThickness * 100 );
        ctx.fillStyle = brakePercent > 30 ? '#2ecc71' : brakePercent > 10 ? '#f39c12' : '#e74c3c';
        ctx.fillText( `刹车片: ${ brakePercent }%`, 10, 80 );

        // 4. 得分显示
        ctx.fillStyle = '#f1c40f';
        ctx.textAlign = 'right';
        ctx.fillText( `得分: ${ state.score }`, config.WIDTH - 10, 30 );

        // 5. 游戏状态提示
        if ( !state.isPlaying || state.isGameOver )
        {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect( 0, 0, config.WIDTH, config.HEIGHT );

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px sans-serif';
            ctx.textAlign = 'center';

            if ( state.isGameOver )
            {
                let message = '';
                let color = '#ffffff';

                switch ( state.endReason )
                {
                    case 'win':
                        message = `停车成功！得分: ${ state.score }`;
                        color = '#2ecc71';
                        break;
                    case 'overshoot':
                        message = '冲过停止线！';
                        color = '#e74c3c';
                        break;
                    case 'crash_pedestrian':
                        message = '撞到行人！';
                        color = '#e74c3c';
                        break;
                    case 'brake_worn_out':
                        message = '刹车片耗尽！';
                        color = '#f39c12';
                        break;
                    default:
                        message = '游戏结束';
                }

                ctx.fillStyle = color;
                ctx.fillText( message, config.WIDTH / 2, config.HEIGHT / 2 - 40 );
                ctx.font = '20px sans-serif';
                ctx.fillText( '点击屏幕重新开始', config.WIDTH / 2, config.HEIGHT / 2 + 20 );
            } else
            {
                ctx.fillText( '生死一刹', config.WIDTH / 2, config.HEIGHT / 2 - 40 );
                ctx.font = '20px sans-serif';
                ctx.fillText( '点击屏幕开始游戏', config.WIDTH / 2, config.HEIGHT / 2 + 20 );
            }
        }
    }

    /**
     * 游戏主循环
     */
    private gameLoop = (): void =>
    {
        const current = Date.now();
        const dt = ( current - this.lastTime ) / 1000 || 0.016;
        this.lastTime = current;

        this.update( dt );
        this.render();

        requestAnimationFrame( this.gameLoop );
    }
}

export default Game;