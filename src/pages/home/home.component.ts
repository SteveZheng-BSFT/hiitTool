import { Component, OnInit, DoCheck } from '@angular/core';

import { NavController, Platform } from 'ionic-angular';
import { HiitPlan } from '../../app/entities/hiit-plan.entity';
import { IHiitPlan } from '../../app/entities/hiit-plan.interface';
import { NativeAudio } from '@ionic-native/native-audio';
import { BackgroundMode } from '@ionic-native/background-mode';
import { Brightness } from '@ionic-native/brightness';
import { Toast } from '@ionic-native/toast';
import { PlanService } from '../../app/services/plan.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.component.html'
})
export class HomePage implements OnInit, DoCheck {
  minute: number;
  second: number;
  msec: number;
  started: boolean;
  simpleInterval: any;
  presetPlan: IHiitPlan;
  currentPlan: HiitPlan;
  planName: string;
  consumedSecondsInOneAction: number; // used to compare seconds in plan
  completedActions: number;
  consumedSecondsInRest: number; // used to compare seconds in plan
  consumedTotalSeconds: number; // used to know when to end
  plannedTotalSeconds: number;
  notifying: string;
  currentStatus: boolean; // true for in exercise, false for in rest
  nextNotification: string;

  plans: HiitPlan[];


  constructor(public navCtrl: NavController, private plt: Platform, private brightness: Brightness,
              private nativeAudio: NativeAudio, private backgroundMode: BackgroundMode, private toast: Toast,
              private planService: PlanService
  ) {
    plt.ready().then(() => {
      nativeAudio.preloadComplex('actionStart', 'assets/audio/isnt-it.m4r', 1, 1, 0).then(()=>console.log('action audio done'), (err)=>console.log('action audio err:'+err));
      nativeAudio.preloadComplex('restStart', 'assets/audio/filling-your-inbox.m4r', 1, 1, 0).then(()=>console.log('rest audio done'), (err)=>console.log('rest audio err:'+err));
      backgroundMode.enable();
      brightness.setKeepScreenOn(true);
    });
  }

  ngOnInit(): void {
    this.minute = 0;
    this.second = 0;
    this.msec = 0;
    this.started = false;
    this.consumedSecondsInOneAction = 0;
    this.completedActions = 0;
    this.consumedTotalSeconds = 0;
    this.consumedSecondsInRest = 0;
    this.completedActions = 0;
    this.plannedTotalSeconds = 0;
    this.currentStatus = true;

    this.currentPlan = this.planService.createCurrentPlan();
    this.presetPlan = {name: 'Default Plan', sets: 5, restTime: 90, actionTime: 30, actions: 2};

    this.plans = this.planService.plans;
  }

  ngDoCheck(): void {
    this.planName = this.currentPlan.showName();
    if (this.currentPlan.allFieldFilled()) {
      // calculate some basic info
      this.plannedTotalSeconds = (this.currentPlan.actions * this.currentPlan.actionTime + +this.currentPlan.restTime) * this.currentPlan.sets - this.currentPlan.restTime;
    }
    this.planService.currentPlan = this.currentPlan;
  }

  toggleTimer(): void {
    this.started = !this.started;
    if (this.started) {
      // start a timer
      this.timing();
    } else {
      // pause a timer
      clearInterval(this.simpleInterval);
    }
  }

  resetTimer(): void {
    // clear interval
    clearInterval(this.simpleInterval);
    this.minute = 0;
    this.second = 0;
    this.msec = 0;
    this.started = false;
    this.consumedSecondsInOneAction = 0;
    this.completedActions = 0;
    this.consumedTotalSeconds = 0;
    this.consumedSecondsInRest = 0;
    this.completedActions = 0;
    this.notifying = '#ffffff';
    this.nextNotification = '';
    this.currentStatus = true;
  }

  ender(): void {
    if (this.consumedTotalSeconds === this.plannedTotalSeconds) {
      this.resetTimer();
    }
  }

  timing(): void {
    this.simpleInterval = setInterval(() => {
      if (this.msec < 9) {
        this.msec++;
      } else {
        this.msec = 0;
        this.consumedTotalSeconds++;
        if (this.currentStatus) {
          // exercise state
          this.consumedSecondsInOneAction++;
        } else {
          this.consumedSecondsInRest++;
        }
        if (this.second < 59) {
          this.second++;
        } else {
          this.second = 0;
          this.minute++;
        }
      }
      this.reminder(); // should remind user to rest/exercise
      this.ender(); // all sets done, then end
    }, 100);
  }

  // TODO: use observable to do this
  reminder(): void {
    // compare exercise time
    if (this.consumedSecondsInOneAction === +this.currentPlan.actionTime) { // input is string
      this.consumedSecondsInOneAction = 0;
      this.completedActions++;
      if (this.completedActions === +this.currentPlan.actions) {
        this.currentStatus = false;
        this.completedActions = 0;
      }
      this.notifyUser();
    }
    // compare rest time
    if (this.consumedSecondsInRest === +this.currentPlan.restTime) {
      this.consumedSecondsInRest = 0;
      this.currentStatus = true;
      this.notifyUser();
    }
  }

  notifyUser(): void {
    // play different audio
    if (this.currentStatus) {
      this.notifying = '#ffad36';
      this.nextNotification = 'Start Action ' + (this.completedActions + 1);
      // this.toast.show("I'm a toast", '5000', 'bottom');
      this.nativeAudio.play('actionStart').then(()=>console.log('action audio played'), (err)=>console.log('action audio not played:'+err));
    } else {
      this.notifying = '#3fe7ff';
      this.nextNotification = 'Take a ' + this.currentPlan.restTime + 's Break';
      this.nativeAudio.play('restStart').then(()=>console.log('rest audio played'), (err)=>console.log('rest audio not played:'+err));
    }
  }

  // TODO: when go to other tabs, ask user to save changes if current plan changed
  loadPlan(hiitPlan: IHiitPlan): void {
    this.currentPlan.setPlan(hiitPlan);
  }

  unloadPlan(): void {
    this.resetTimer();
    this.currentPlan.clear();
    this.plannedTotalSeconds = 0;
  }
}
