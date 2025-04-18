import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Task } from 'src/app/api/models/task';
import { TaskService } from 'src/app/api/services/task.service';
import { FileDownloaderService } from '../file-downloader/file-downloader.service';
import { DashboardViews } from 'src/app/projects/states/dashboard/directives/task-dashboard/task-dashboard.component';

@Component({
  selector: 'f-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  constructor(public taskService: TaskService, private fileDownloader: FileDownloaderService) {}

  @Input() selectedTask$: Observable<Task>;
  selectedTask: Task;
  @Input() currentView$: Subject<DashboardViews>;

  @ViewChild('similaritiesButton', { static: false, read: ElementRef }) similaritiesButton: ElementRef;
  @ViewChild('warningText', { static: false, read: ElementRef }) warningText: ElementRef;
  public leftOffset: number;
  public topOffset: number;
  public warningTextLeftOffset: number;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    // After window resizes, calc the location of the elements again
    this.findSimilaritiesButton();
  }

  findSimilaritiesButton() {
    if (!this.selectedTask?.similaritiesDetected) return;

    const w = this.similaritiesButton?.nativeElement.getBoundingClientRect().width;
    this.leftOffset = this.similaritiesButton?.nativeElement.offsetLeft + w / 2;
    this.topOffset = this.similaritiesButton?.nativeElement.offsetTop - 14;

    const totalPaddingOffset = 30;
    this.warningTextLeftOffset =
      this.leftOffset - (this.warningText?.nativeElement.getBoundingClientRect().width + totalPaddingOffset) / 2;
  }

  ngOnInit(): void {
    this.selectedTask$.subscribe((task) => {
      this.selectedTask = task;
      // We need to timeout to give the DOM a chance to place the elements
      setTimeout(() => {
        this.findSimilaritiesButton();
      }, 10);
    });
  }

  downloadFiles() {
    this.fileDownloader.downloadFile(
      this.selectedTask.submittedFilesUrl(true),
      `${this.selectedTask.project.student.lastName}-${this.selectedTask.definition.name}.zip`
    );
  }

  downloadSubmissionPdf() {
    this.fileDownloader.downloadFile(
      this.selectedTask.submissionUrl(true),
      `${this.selectedTask.project.student.lastName}-${this.selectedTask.definition.name}.pdf`
    );
  }

  viewTaskSheet() {
    this.currentView$.next(DashboardViews.task);
  }

  viewSubmission() {
    this.currentView$.next(DashboardViews.submission);
  }

  viewSimilarity() {
    this.currentView$.next(DashboardViews.similarity);
  }

  public get hasTaskSheet(): boolean {
    return this.selectedTask?.definition?.hasTaskSheet;
  }

  public get hasSubmissionPdf(): boolean {
    return this.selectedTask?.hasSubmissionPdf;
  }
}
