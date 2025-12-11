// src/databus.ts

/**
 * 游戏状态管理器 - DataBus
 * 集中管理游戏状态、物理参数、游戏对象等数据
 */


// DataBus 单例类
class DataBus
{
  private static instance: DataBus;

  // 游戏状态
  public frame: number = 0;
  public score: number = 10; // 初始积分
  public config = {
    WIDTH: 375,
    HEIGHT: 667,
    BACKGROUND_COLOR: '#2c3e50',
  };

  private constructor ()
  {
  }

  public static getInstance (): DataBus
  {
    if ( !DataBus.instance )
    {
      DataBus.instance = new DataBus();
    }
    return DataBus.instance;
  }
  /**
  * 初始化配置（在游戏开始时调用）
  */
  public initConfig ( width: number, height: number ): void
  {
    this.config.WIDTH = width;
    this.config.HEIGHT = height;
    console.log( `DataBus配置初始化: ${ width }x${ height }` );
  }
  /**
   * 重置游戏数据
   */
  reset (): void
  {
    this.frame = 0;
  }
}

// 导出单例
export default DataBus.getInstance();