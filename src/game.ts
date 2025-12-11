// src/game.ts
import DataBus from "./databus";
import { getScreenInfo } from '../mytsglib/core/utils/screen/screenUtils';
const canvas = wx.createCanvas();
const ctx = canvas.getContext( '2d' );

// 获取 DataBus 实例
const databus = DataBus;


class Game
{


    constructor ()
    {
        console.log( '11' )
        this.resetGame();
        this.gameLoop();
    }

    public resetGame (): void
    {
        var info = getScreenInfo();
        databus.initConfig( info.width, info.height );
    }


    private update ( dt: number ): void
    {

    }

    private render (): void
    {
        // 清空画布
        ctx.clearRect( 0, 0, databus.config.WIDTH, databus.config.HEIGHT );

        // 首先渲染游戏场景（无论什么状态都渲染背景和游戏元素）
        this.renderGame();

    }

    private renderGame (): void
    {
        // 绘制背景
        ctx.fillStyle = databus.config.BACKGROUND_COLOR;
        ctx.fillRect( 0, 0, databus.config.WIDTH, databus.config.HEIGHT );

    }

    private lastTime: number = 0;
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