#include <MeMegaPi.h>
Servo sv;
MeStepperOnBoard stepper(SLOT1);
MeRGBLed led1(PORT_6);
MeRGBLed led2(PORT_8);
int dist = 800;
unsigned long lastTime = 0;
int servoPin = A10;
int light = 150;
String received = "";
void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  Serial2.begin(115200);
  stepper.setMaxSpeed(10000);
  stepper.setAcceleration(2000);
  stepper.setMicroStep(16);
  stepper.setSpeed(1000);
  sv.attach(servoPin);
  pinMode(A11,INPUT_PULLUP);
  stepper.disableOutputs();
  runServo(65,8);
  led1.setColor(light,light-0,light-30);
  led1.show();
  led2.setColor(light,light-0,light-30);
  led2.show();
  delay(1000);
  sv.detach();
}
long currentSteps = 0;
long targetSteps = 0;
int speedTime = 1800;
int currentAngle = 70;
int prevButtonState = 1;
int buttonState = 1;
int dirSpeed = 3;
void loop() {
  prevButtonState = buttonState;
  buttonState = digitalRead(A11);
  if(buttonState!=prevButtonState){
    if(prevButtonState == 0){
      Serial2.println("start");
      Serial.println("start");
    }
  }
  if(Serial2.available()){
    char c = Serial2.read();
    if(c=='\n'){
      parseCommand();
      received="";
    }else{
      received+=c;
    }
  }
}

void releaseCube(){
  enableServo();
  delay(50);
  runServo(0,8);
  delay(50);
}
void lockCube(){
  enableServo();
  delay(50);
  //runServo(30,currentAngle<5?20:5);
  //delay(50);
  runServo(55,8);
  delay(50);
  disableServo();
}
void flipCube(){
  enableServo();
  delay(100);
  if(currentAngle<5){
    runServo(30,22);
  }
  runServo(135,5);
  delay(50);
  runServo(30,4);
  delay(50);
  runServo(55,5);
  delay(50);
  disableServo();
}
void enableServo(){
  sv.attach(servoPin);
}
void disableServo(){
   //sv.detach();
}

void update() {
  unsigned long ct = micros();
  if(ct - lastTime>speedTime||ct<lastTime){
    speedTime-=dirSpeed;
    if(speedTime<200){
      speedTime = 200;
      dirSpeed = -1;
    }
    if(dirSpeed == -1){
      if(speedTime>500){
        speedTime=500;
      }
    }
    lastTime = ct;
    if(targetSteps!=currentSteps){
      if(currentSteps<targetSteps){
        stepper.setDir(1);
        currentSteps++;
      }else{
        stepper.setDir(0);
        currentSteps--;
      }
      stepper.step();
    }else{
      speedTime = 1800;
    }
  }
}

void parseCommand() {
  received.toLowerCase();
  char m_cmd = received.substring(0, 1).charAt(0);
  int s_cmd = received.substring(1,2).toInt();
  int v_cmd = received.substring(4).toInt();
  Serial.println(received);
  if(m_cmd=='m'){
    if(s_cmd==1){
      releaseCube();
      targetSteps=currentSteps+v_cmd*800;
      //stepper.enableOutputs();
      dirSpeed = 3;
      while(true){
        update();
        if(targetSteps==currentSteps){
          speedTime = 1500;
          targetSteps = 0;
          currentSteps = 0;
          break;
        }
      }
      //stepper.disableOutputs();
    }else if(s_cmd==2){
      lockCube();
      targetSteps=currentSteps+v_cmd*800;
      //stepper.enableOutputs();
      int ex; 
      if(currentSteps<targetSteps){
        ex=65;
      }else{
        ex=-65;
      }
      dirSpeed = 3;
      while(true){
        update();
        if(targetSteps==currentSteps){
          targetSteps = 0;
          currentSteps = 0;
          speedTime = 1500;
          break;
        }
      }
      targetSteps=currentSteps+ex;
      dirSpeed = 3;
      while(true){
        update();
        if(targetSteps==currentSteps){
          speedTime = 1500;
          targetSteps = 0;
          currentSteps = 0;
          break;
        }
      }
      targetSteps=currentSteps-ex;
      dirSpeed = 3;
      while(true){
        update();
        if(targetSteps==currentSteps){
          speedTime = 1500;
          targetSteps = 0;
          currentSteps = 0;
          break;
        }
      }
      //stepper.disableOutputs();
    }else if(s_cmd==3){
      for(int i=0;i<v_cmd;i++){
        flipCube();
      }
    }else if(s_cmd==4){
      if(v_cmd==0){
        stepper.disableOutputs();
        sv.detach();
        led1.setColor(0,0,0);
        led1.show();
        led2.setColor(0,0,0);
        led2.show();
      }else{
        stepper.enableOutputs();
        sv.attach(servoPin);
        led1.setColor(light,light,light-50);
        led1.show();
        led2.setColor(light,light,light-50);
        led2.show();
      }
    }else if(s_cmd==5){
      if(v_cmd==0){
        lockCube();
      }else if(v_cmd==1){
        releaseCube();
      }
    }
    Serial2.println("ok");
    Serial.println("ok");
  }
}

void runServo(int targetAngle,int spdTime){
  while(currentAngle!=targetAngle){
    if(currentAngle>targetAngle){
      currentAngle-=1;  
      //spdTime=(currentAngle-targetAngle)*0.1+3;
    }else if(currentAngle<targetAngle){
      currentAngle+=1;  
      //spdTime=(targetAngle-currentAngle)*0.1+3;
    }
    sv.write(currentAngle);
    delay(spdTime);
  }
}

