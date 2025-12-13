// 游戏配置
export interface GameConfig
{
    WIDTH: number;
    HEIGHT: number;
    BACKGROUND_COLOR: string;
    STOP_LINE_Y: number;
    ZEBRA_START_Y: number;
    ZEBRA_END_Y: number;
    MAX_SPEED: number;
    FRICTION: number;
    BRAKE_FORCE: number;
    CAR_WIDTH: number;
    CAR_HEIGHT: number;
}

// 游戏状态
export interface GameState
{
    score: number;
    brakePadThickness: number;
    isGameOver: boolean;
    isPlaying: boolean;
    distanceToStop: number;
    endReason: GameEndReason | null;
}

// 游戏结束原因
export type GameEndReason =
    | 'win'
    | 'overshoot'
    | 'crash_pedestrian'
    | 'brake_worn_out';

// 车辆状态
export interface Car
{
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    angle: number;
    maxSpeed: number;
    friction: number;
    brakeForce: number;
}

// 输入控制
export interface InputControl
{
    isBraking: boolean;
    steerDirection: number; // -1: 左, 0: 中, 1: 右
}

// 障碍物
export interface Obstacle
{
    id: string;
    type: 'pedestrian' | 'vehicle';
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
    speedX?: number;
    speedY?: number;
}

// 矩形碰撞区域
export interface Rect
{
    x: number;
    y: number;
    width: number;
    height: number;
}

// 游戏资产
export interface GameAssets
{
    car?: HTMLImageElement;
    pedestrian?: HTMLImageElement;
    road?: HTMLImageElement;
}

// 相机
export interface Camera
{
    x: number;
    y: number;
    targetY: number;
}