import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Grade} from 'src/app/api/models/grade';
import {TaskDefinition, Task, Project} from 'src/app/api/models/doubtfire-model';
import {TaskDefinitionNamePipe} from 'src/app/common/filters/task-definition-name.pipe';
import {BehaviorSubject, Observable} from 'rxjs';

@Component({
  selector: 'f-unit-task-list',
  templateUrl: './unit-task-list.component.html',
  styleUrls: ['./unit-task-list.component.scss'],
})
export class FUnitTaskListComponent implements OnInit {
  @Input() mode: 'project' | 'all-tasks';
  @Input() taskDefinitions: TaskDefinition[];
  @Input() tasks: Task[];

  // What is the selected task definition
  @Input() selectedTaskDefinition$: BehaviorSubject<TaskDefinition>;
  selectedTaskDef: TaskDefinition;
  @Input() selectedTask$: BehaviorSubject<Task>;
  @Input() targetGradeChange$: Observable<Project>;

  // @Output() selectedTask: EventEmitter<Task> = new EventEmitter<Task>();

  filteredTaskDefinitions: TaskDefinition[]; // list of tasks which match the taskSearch term
  searchText: string = ''; // task search term from user input
  taskDefinitionNamePipe = new TaskDefinitionNamePipe();
  protected gradeNames: string[] = Grade.GRADES;

  applyFilters() {
    this.filteredTaskDefinitions = this.taskDefinitionNamePipe.transform(
      this.taskDefinitions.filter((taskDef) => this.mode === 'all-tasks' || !!this.taskForTaskDef(taskDef)),
      this.searchText,
    );
  }

  public get hasTasks(): boolean {
    return this.tasks && this.tasks.length > 0;
  }

  public taskForTaskDef(taskDef: TaskDefinition): Task {
    if (!this.hasTasks || !taskDef) {
      return null;
    }

    return this.tasks.find((task) => task.definition.id === taskDef?.id);
  }

  ngOnInit(): void {
    // Watch for changes in the selected task definition... including from us
    this.selectedTaskDefinition$.subscribe((taskDef) => {
      this.selectedTaskDef = taskDef;
    });

    this.targetGradeChange$.subscribe((project) => {
      this.applyFilters();
    });

    this.applyFilters();
  }

  setSelectedTaskDefinition(taskDef: TaskDefinition) {
    if (this.isSelectedTaskDefinition(taskDef)) {
      this.selectedTaskDefinition$.next(null);
      this.selectedTask$.next(null);
    } else {
      this.selectedTaskDefinition$.next(taskDef);
      this.selectedTask$.next(this.taskForTaskDef(taskDef));
    }
  }

  public isSelectedTaskDefinition(taskDef: TaskDefinition): boolean {
    return this.selectedTaskDef?.id === taskDef?.id;
  }
}
