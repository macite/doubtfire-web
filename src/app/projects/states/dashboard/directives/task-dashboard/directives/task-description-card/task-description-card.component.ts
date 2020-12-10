import { Component, Input, Inject } from '@angular/core';
import { Moment } from 'moment';
import { gradeService, Task } from 'src/app/ajs-upgraded-providers';
import { saveAs } from 'file-saver';

@Component({
  selector: 'task-description-card',
  templateUrl: 'task-description-card.component.html',
  styleUrls: ['task-description-card.component.scss']
})
export class TaskDescriptionCardComponent {
  @Input() task: any;
  @Input() taskDef: any;
  @Input() unit: any;

  public grades: {names: any, acronyms: any};

  constructor(
    @Inject(gradeService) private gradeService: any,
    @Inject(Task) private taskAPI: any,
  ) {
    this.grades = {
      names: gradeService.grades,
      acronyms: gradeService.gradeAcronyms
    };
  }

  public downloadTaskSheet() {
    saveAs(this.taskAPI.getTaskPDFUrl(this.unit, this.taskDef), `${this.unit.code}-${this.taskDef.abbreviation}-TaskSheet.pdf`);
  }

  public downloadResources() {
    saveAs(this.taskAPI.getTaskResourcesUrl(this.unit, `${this.unit.code}-${this.taskDef.abbreviation}-TaskResources.zip`));
  }

  public dueDate() : Moment {
    if (this.task)
      return this.task.localDueDate();
    else if (this.taskDef)
      return this.taskDef.target_date;
    else
      return undefined;
  }

  public startDate() : Moment {
    if (this.taskDef)
      return this.taskDef.start_date;
    else
      return undefined;
  }

  public shouldShowDeadline() : boolean {
    return this.task && this.task.daysUntilDeadlineDate() <= 14
  }
}