import {
  Component,
  Input,
} from '@angular/core';
import {Task} from 'src/app/api/models/task';
import { DashboardViews } from '../../task-dashboard.component';
import { Subject } from 'rxjs';


@Component({
  selector: 'f-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss'],
})
export class TaskDetailsComponent {
  @Input() task: Task;
  @Input() currentView$: Subject<DashboardViews>;

}
