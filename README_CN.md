# 三阶魔方机器人
## 魔方基本元素
### 结构

三阶魔方由1个中心轴、6个中心块、12个边块及8个角块构成，当它们组合在一起的时候每个零件会互相牵制不会散开，并且任何一面都可水平转动而不影响到其他方块。三阶魔方的结构不只一种，例如空心魔方。
 * 中心块
  
  中心块与中心轴连接在一起，但可以顺着轴的方向自由地转动。

 * 边块
  
  边块的表面是两个正方形，结构类似一个长方体从立方体的一个边凸出来，这样的结构可以让边块嵌在两个中心块之间。

 * 角块
  
  角块的表面是三个正方形，结构类似一个小立方体从立方体的一个边凸出来，这样的结构可以让角块嵌在三个边块之间。

 * 每个块的编号
 
  ![cubes](https://github.com/xeecos/RubikCubeSolver/raw/master/images/1.jpg)

### 解魔方动作的书写方式
  U的转法，即顺时钟转动上层，为了记录下复原、转乱的过程或公式的步骤，会用Singmaster符号来书写（由David Singmaster发明）。
  
  书写方式如下：
  * R(Right)、L(Left)、U(Up)、D(Down)、F(Front)、B(Back)分别代表右、左、上、下、前、后层。
  * 若是顺时针旋转，则直接写上符号；若是逆时针旋转，则在符号后加上“'”或是“i”；若是旋转180°，则在符号后加上“2”或是“²”。
  * 若要更加详细纪录整个过程，还会使用以下符号：
    - x、y、z分别代表将整个魔方做R、U、F，因为在速解魔方的时候，并不会总是将一个面朝向自己。
    - r、l、u、d、f、b分别代表右、左、上、下、前、后两层，代表连中间层一起转。
    - M(Middle)、E(Equator)、S(Side)代表旋转中间层，相当于Rr'、Uu'、Bb'。

## 解魔方算法

 * CFOP（又称弗雷德里奇法（Fridrich Method））是速解魔方最常用的公式系统之一，由底十字（Cross）、下两层（F2L，First 2 Layers）、顶层定向（OLL，Orientation of last layer）、顶层排列（PLL，Permutation of last layer）四个步骤组成。
 * 本项目使用的算法来源：http://en.wikipedia.org/wiki/Optimal_solutions_for_Rubik's_Cube#Thistlethwaite.27s_algorithm
 * Javascript版本：https://github.com/stringham/rubiks-solver

## 图像采集和颜色识别

 * 树莓派可以使用支持UVC的摄像头，并通过```v4l2-ctl```命令调整摄像头参数。
 * 在nodejs环境下，可以使用``linuxcam```采集到摄像头每帧图像的RGB数据，有了这些数据我们可以区分出魔方每一个块的颜色。
 * 例如：红色时，R值非常大，G和B值非常小。
 * 通过翻转和旋转魔方，摄像头可以采集到六面54个方格的颜色，并能计算出魔方初始的状态。再通过解魔方算法将解魔方过程的动作计算出来。

## 整体方案

 * 树莓派负责图像采集和魔方识别，并计算出解魔方步骤，并转换成动作序列。
 * MegaPi负责接收树莓派的运动指令和传感器指令驱动舵机和步进电机。
 * Makeblock金属材料搭建解魔方抓取和旋转机构。

## 运动机构

使用1个舵机和1个步进电机通过机械结构实现魔方三个动作：

 1. 魔方整体水平旋转90°：连杆松开，底盘旋转。![cubes](https://github.com/xeecos/RubikCubeSolver/raw/master/images/4.jpg)
 2. 魔方底层逆时针或顺时针旋转90°：连杆扣住魔方，底盘旋转。![cubes](https://github.com/xeecos/RubikCubeSolver/raw/master/images/3.jpg)
 3. 魔方垂直翻转90°：连杆做直线往返运动。![cubes](https://github.com/xeecos/RubikCubeSolver/raw/master/images/2.jpg)

通过这3个动作可以完成UFDLRB六面任意的旋转，实现解魔方的动作。

## 运行效果

[![cubes](https://github.com/xeecos/RubikCubeSolver/raw/master/images/5.jpg)](http://v.youku.com/v_show/id_XMTU3NTA0NjE5Ng==.html)

## 使用方法

MegaPi：

 * 安装Makeblock libraries（https://github.com/Makeblock-official/Makeblock-Libraries）， 使用Arduino IDE 编译并上传Arduino代码

树莓派：

 ```
 git clone https://github.com/xeecos/RubikCubeSolver
 cd RubikCubeSolver
 npm install
 node server_offline.js
 ```
 连线：
  * 步进电机接Slot 1
  * 舵机接Port7 Slot1
  * 开关接Port7 Slot2
