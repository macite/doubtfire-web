import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewContainerRef,
} from '@angular/core';
import {UIRouter} from '@uirouter/core';
import { Subject } from 'rxjs';
import {Task} from 'src/app/api/models/task';
import {TaskService} from 'src/app/api/services/task.service';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {TaskAssessmentModalService} from 'src/app/common/modals/task-assessment-modal/task-assessment-modal.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';

export enum DashboardViews {
  submission,
  task,
  similarity,
}

@Component({
  selector: 'f-task-dashboard',
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.scss'],
})
export class TaskDashboardComponent implements OnInit, OnChanges {
  @Input() task: Task;

  /**
   * Subject reports changes to the current view.
   */
  @Input() currentView$: Subject<DashboardViews>;
  public currentView: DashboardViews = DashboardViews.submission;

  @Input() pdfUrl$: Subject<string>;

  readonly viewContainerRef: ViewContainerRef;

  /**
   * Ensure DashboardViews is available in the template
   */
  public DashboardViews = DashboardViews;

  public taskStatusData: any;
  public tutor = this.router.globals.params.tutor;
  public overseerEnabledObs = this.doubtfire.IsOverseerEnabled;

  constructor(
    private doubtfire: DoubtfireConstants,
    private taskService: TaskService,
    private taskAssessmentModal: TaskAssessmentModalService,
    private fileDownloader: FileDownloaderService,
    private router: UIRouter,
  ) {
  }

  ngOnInit(): void {
    // Default to the submission view
    // this.currentView$.next(DashboardViews.submission);
    this.currentView$.subscribe((view) => {
      this.currentView = view;
      this.pdfUrl$?.next(this.pdfUrl);
      console.log(this.pdfUrl);
    });

    this.taskStatusData = {
      keys: this.taskService.markedStatuses.slice().sort((a, b) => {
        return this.taskService.statusSeq.get(a) - this.taskService.statusSeq.get(b);
      }),
      help: this.taskService.helpDescriptions,
      icons: this.taskService.statusIcons,
      labels: this.taskService.statusLabels,
      class: this.taskService.statusClass,
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.task) {
      this.pdfUrl$.next(this.pdfUrl);
    }
  }

  public get pdfUrl(): string {
    switch(this.currentView) {
      case DashboardViews.task:
        return this.task?.definition.getTaskPDFUrl();
      case DashboardViews.submission:
        return this.task?.submissionUrl(false);
      default:
        return this.task?.definition.getTaskPDFUrl();
    }
  }

  public get overseerEnabled() {
    return this.doubtfire.IsOverseerEnabled.value && this.task?.overseerEnabled;
  }

  showSubmissionHistoryModal() {
    this.taskAssessmentModal.show(this.task);
  }

  downloadSubmission() {
    this.fileDownloader.downloadFile(this.task.submissionUrl(true), 'submission.pdf');
  }

  downloadSubmittedFiles() {
    this.fileDownloader.downloadFile(this.task.submittedFilesUrl(true), 'submitted-files.zip');
  }
}
