import { Car, GameConfig, Rect, Obstacle } from '../types';

/**
 * 检测两个矩形的碰撞
 */
export function checkCollision ( rect1: Rect, rect2: Rect ): boolean
{
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

/**
 * 计算到停止线的距离
 */
export function getDistanceToStop ( car: Car, config: GameConfig ): number
{
    const carFrontY = car.y + car.height;
    return config.STOP_LINE_Y - carFrontY;
}

/**
 * 计算得分
 */
export function calculateScore ( distance: number ): number
{
    const perfectRange = 50;
    const goodRange = 100;
    const okRange = 200;

    if ( Math.abs( distance ) <= perfectRange ) return 100;
    if ( Math.abs( distance ) <= goodRange ) return 80;
    if ( Math.abs( distance ) <= okRange ) return 60;
    if ( distance > 0 && distance <= 400 ) return 40;
    return 0;
}

/**
 * 更新刹车片厚度
 */
export function updateBrakeThickness (
    currentThickness: number,
    isBraking: boolean
): number
{
    if ( !isBraking ) return currentThickness;

    const wearRate = 0.001;
    const newThickness = currentThickness - wearRate;
    return Math.max( 0, newThickness );
}

/**
 * 生成随机数
 */
export function randomRange ( min: number, max: number ): number
{
    return Math.random() * ( max - min ) + min;
}

/**
 * 限制数值范围
 */
export function clamp ( value: number, min: number, max: number ): number
{
    return Math.max( min, Math.min( max, value ) );
}

/**
 * 线性插值
 */
export function lerp ( start: number, end: number, t: number ): number
{
    return start + ( end - start ) * t;
}