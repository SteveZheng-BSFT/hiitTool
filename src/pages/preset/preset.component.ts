import { Component, OnInit, ViewChild } from '@angular/core';

import { AlertController, List, NavController } from 'ionic-angular';
import { PlanService } from '../../app/services/plan.service';
import { HiitPlan } from '../../app/entities/hiit-plan.entity';
import { DatePipe } from '@angular/common';

// todo: add animations close/open input-group
@Component({
  selector: 'page-preset',
  templateUrl: 'preset.component.html'
})
export class PresetPage implements OnInit {
  editMode: boolean;
  searchString: string;
  rotateDegree: number;
  rotateFunc: string;
  @ViewChild(List) list: List;

  constructor(public navCtrl: NavController, public planService: PlanService,
              private alertCtrl: AlertController, private datePipe: DatePipe) {
  }

  ngOnInit(): void {
    this.editMode = false;
    this.searchString = ''; // if don't set '', search bar will show undefined
    this.rotateDegree = 0;
  }

  //todo: after click update, window opens but also auto focused on the clicked part
  togglePlanEditor(plan?: HiitPlan): void {
    // if try to update a plan
    // if try to add a new plan, just give a empty object
    // if try to close 'input-group' empty current plan
    this.planService.createCurrentPlan(plan);
    if (plan) {
      if (!this.editMode) {
        this.editMode = true;
        this.rotateAnimation();
      }
      this.list.closeSlidingItems();
    } else {
      this.editMode = !this.editMode;
      this.rotateAnimation();
    }
  }

  rotateAnimation(): void {
    this.rotateDegree += 135;
    this.rotateFunc = 'rotate(' + this.rotateDegree + 'deg)';
  }

  remove(id: string) {
    this.planService.remove(id);
  }

  removeAllPlans(): void {
    this.alertCtrl.create({
      title: 'Are You Sure?',
      subTitle: 'Lost Data are Nonrecoverable',
      buttons: [
        'Dismiss',
        {
          text: 'Remove',
          handler: () => this.planService.removeAll()
        }
      ]
    }).present();
  }

  showDetails(plan: HiitPlan) {
    let message = 'Sets: ' + plan.sets + ', Rest Time: ' + plan.restTime + 's<br>actions: ' + plan.actions +
                  ', Action Time ' + plan.actionTime + 's<br>Description: ' + (plan.description || '');

    this.alertCtrl.create({
      title: plan.name,
      subTitle: 'Last update: ' + this.datePipe.transform(plan.updatedOn, 'MM/dd/y, H:mm:ss'),
      message,
      buttons: [
        'Dismiss',
        {
          text: 'Load Plan',
          handler: () => this.loadPlan(plan)
        }
      ]
    }).present();

    this.list.closeSlidingItems();
  }

  // navigate to home and load plan
  loadPlan(plan) {
    this.planService.currentPlan = plan;
    this.navCtrl.parent.select(0);
  }

  onSearchBarInput(event) {
    let val = event.target.value;
    if (val && val.trim() !== '') {
      this.searchString = val;
    } else {
      this.searchString = '';
    }
  }
}
