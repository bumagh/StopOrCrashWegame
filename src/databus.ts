import { GameConfig, GameState, InputControl, Car, Obstacle, GameAssets, Camera } from './types';

class DataBus
{
  // 游戏配置
  public config: GameConfig = {
    WIDTH: 375,
    HEIGHT: 667,
    BACKGROUND_COLOR: '#2d2d2d',
    STOP_LINE_Y: 3000,
    ZEBRA_START_Y: 2800,
    ZEBRA_END_Y: 2900,
    MAX_SPEED: 15,
    FRICTION: 0.05,
    BRAKE_FORCE: 0.4,
    CAR_WIDTH: 50,
    CAR_HEIGHT: 90
  };

  // 游戏状态
  public state: GameState = {
    score: 0,
    brakePadThickness: 1.0,
    isGameOver: false,
    isPlaying: false,
    distanceToStop: 0,
    endReason: null
  };

  // 车辆状态
  public car: Car = {
    x: 0,
    y: 0,
    width: 50,
    height: 90,
    speed: 0,
    angle: 0,
    maxSpeed: 15,
    friction: 0.05,
    brakeForce: 0.4
  };

  // 输入控制
  public input: InputControl = {
    isBraking: false,
    steerDirection: 0
  };

  // 障碍物
  public obstacles: Obstacle[] = [];

  // 游戏资产
  public assets: GameAssets = {};

  // 相机
  public camera: Camera = {
    x: 0,
    y: 0,
    targetY: 0
  };

  // 私有实例
  private static instance: DataBus;

  // 获取单例
  public static getInstance (): DataBus
  {
    if ( !DataBus.instance )
    {
      DataBus.instance = new DataBus();
    }
    return DataBus.instance;
  }

  /**
   * 初始化配置
   */
  public initConfig ( width: number, height: number ): void
  {
    this.config.WIDTH = width;
    this.config.HEIGHT = height;
    this.car.x = width / 2 - this.car.width / 2;
    this.state.distanceToStop = this.config.STOP_LINE_Y;
  }

  /**
   * 重置游戏数据
   */
  public resetGame (): void
  {
    this.state = {
      score: 0,
      brakePadThickness: 1.0,
      isGameOver: false,
      isPlaying: false,
      distanceToStop: this.config.STOP_LINE_Y,
      endReason: null
    };

    this.car = {
      x: this.config.WIDTH / 2 - this.config.CAR_WIDTH / 2,
      y: 0,
      width: this.config.CAR_WIDTH,
      height: this.config.CAR_HEIGHT,
      speed: 0,
      angle: 0,
      maxSpeed: this.config.MAX_SPEED,
      friction: this.config.FRICTION,
      brakeForce: this.config.BRAKE_FORCE
    };

    this.input = { isBraking: false, steerDirection: 0 };
    this.obstacles = [];
    this.camera = { x: 0, y: 0, targetY: 0 };
  }

  /**
   * 设置输入控制
   */
  public setInput ( control: Partial<InputControl> ): void
  {
    this.input = { ...this.input, ...control };
  }

  /**
   * 更新游戏状态
   */
  public updateState ( updates: Partial<GameState> ): void
  {
    this.state = { ...this.state, ...updates };
  }

  /**
   * 加载资源
   */
  public loadAssets (): Promise<void>
  {
    return new Promise( ( resolve, reject ) =>
    {
      // 这里可以根据需要加载图片资源
      // 小程序中可能需要使用 wx.createImage() 或 wx.downloadFile()
      resolve();
    } );
  }
}

export default DataBus.getInstance();