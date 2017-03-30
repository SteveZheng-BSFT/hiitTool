import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PlanService } from '../../services/plan.service';

@Component({
  selector: 'app-input-group',
  templateUrl: 'input-group.component.html'
})
export class InputGroupComponent {
  @Input() started?: boolean;
  @Input() presetMode?: boolean;
  @Output() savedStatus: EventEmitter<boolean>;

  constructor(public planService: PlanService) {
    this.savedStatus = new EventEmitter();
  }

  savePlan(): void {
    this.planService.savePlan();
    // true means nothing, just a flag to tell upper to close window
    this.savedStatus.emit(true);
  }
}
