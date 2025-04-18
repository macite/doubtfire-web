import {CdkDragEnd, CdkDragStart, CdkDragMove} from '@angular/cdk/drag-drop';
import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {MediaObserver} from 'ng-flex-layout';
import {UIRouter} from '@uirouter/angular';
import {auditTime, BehaviorSubject, merge, Observable, of, Subject, tap, withLatestFrom} from 'rxjs';
import {Task} from 'src/app/api/models/task';
import {Unit} from 'src/app/api/models/unit';
import {UnitRole} from 'src/app/api/models/unit-role';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {HotkeysService, HotkeysHelpComponent} from '@ngneat/hotkeys';
import {MatDialog} from '@angular/material/dialog';
import {UserService} from 'src/app/api/services/user.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import { DashboardViews } from 'src/app/projects/states/dashboard/directives/task-dashboard/task-dashboard.component';

@Component({
  selector: 'f-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss'],
})
export class InboxComponent implements OnInit, OnDestroy {
  @Input() unit: Unit;
  @Input() unitRole: UnitRole;
  @Input() taskData: {selectedTask: Task; };

  public currentView$ = new BehaviorSubject<DashboardViews>(DashboardViews.submission);
  public selectedTask$ = new BehaviorSubject<Task>(null);
  private selectedTask: Task;

  /**
   * Listen for changes to the shown PDF in the task dashboard.
   */
  public viewedPdfUrl$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public pdfUrl: string;

  @ViewChild('inboxpanel') inboxPanel: ElementRef;
  @ViewChild('commentspanel') commentspanel: ElementRef;

  subs$: Observable<unknown>;

  private inboxStartSize$ = new Subject<number>();
  private dragMove$ = new Subject<{event: CdkDragMove; div: HTMLDivElement}>();
  private dragMoveAudited$;

  protected filters;
  protected showSearchOptions;

  public taskSelected: boolean = false;

  get narrowTaskInbox(): boolean {
    return this.inboxPanel?.nativeElement.getBoundingClientRect().width < 150;
  }

  constructor(
    private hotkeys: HotkeysService,
    public mediaObserver: MediaObserver,
    public fileDownloader: FileDownloaderService,
    private router: UIRouter,
    public dialog: MatDialog,
    private userService: UserService,
    private constants: DoubtfireConstants,
  ) {
    this.selectedTask$.subscribe((task) => {
      task?.getSubmissionDetails().subscribe();
      this.selectedTask = task;
      this.taskSelected = !!task;
    });

    this.viewedPdfUrl$.subscribe((url) => {
      this.pdfUrl = url;
    });
  }

  ngOnInit(): void {
    const registeredHotkeys = this.hotkeys.getHotkeys().map((hotkey) => hotkey.keys);

    if (!registeredHotkeys.includes('shift.?')) {
      this.hotkeys.registerHelpModal(() => {
        const ref = this.dialog.open(HotkeysHelpComponent, {
          // width: '250px',
        });
        ref.componentInstance.title = `${this.constants.ExternalName.value} Feedback Shortcuts`;
        ref.componentInstance.dismiss.subscribe(() => ref.close());
      });
    }

    if (!registeredHotkeys.includes('control.shift.f')) {
      this.hotkeys
        .addShortcut({
          keys: 'control.shift.f',
          description: 'Mark selected task as fix',
        })
        .subscribe(() => this.selectedTask.updateTaskStatus('fix_and_resubmit'));
    }

    if (!registeredHotkeys.includes('control.shift.c')) {
      this.hotkeys
        .addShortcut({
          keys: 'control.Shift.c',
          description: 'Mark selected task as complete',
        })
        .subscribe(() =>
          this.selectedTask.updateTaskStatus('complete')
      );
    }

    if (!registeredHotkeys.includes('control.shift.d')) {
      this.hotkeys
        .addShortcut({
          keys: 'control.shift.d',
          description: 'Mark selected task as discuss',
        })
        .subscribe(() => this.selectedTask.updateTaskStatus('discuss'));
    }

    this.dragMoveAudited$ = this.dragMove$.pipe(
      withLatestFrom(this.inboxStartSize$),
      auditTime(30),
      tap(([moveEvent, startSize]) => {
        window.dispatchEvent(new Event('resize'));

        let newWidth: number;
        let width: number;
        if (moveEvent.div.id === 'inboxpanel') {
          newWidth = startSize + moveEvent.event.distance.x;

          // if width is belo 250, snap to 50px
          if (newWidth < 250 && newWidth > 100) {
            width = 250;
          } else if (newWidth < 150) {
            width = 50;
          } else {
            width = Math.min(newWidth, 500);
          }
        } else {
          newWidth = startSize - moveEvent.event.distance.x;
          width = Math.min(Math.max(newWidth, 250), 500);
        }
        moveEvent.div.style.width = `${width}px`;
        moveEvent.event.source.reset();
      }),
    );
    this.subs$ = merge(this.dragMoveAudited$, of(true));
    window.dispatchEvent(new Event('resize'));
  }

  ngOnDestroy(): void {
    this.hotkeys.removeShortcuts('control.shift.d');
    this.hotkeys.removeShortcuts('control.shift.f');
    this.hotkeys.removeShortcuts('control.shift.c');
    this.hotkeys.removeShortcuts('shift.?');
  }

  startedDragging(event: CdkDragStart, div: HTMLDivElement) {
    event.source.element.nativeElement.classList.add('hovering');
    const w = div.getBoundingClientRect().width;
    this.inboxStartSize$.next(w);
  }

  dragging(event: CdkDragMove, div: HTMLDivElement) {
    this.dragMove$.next({event, div});
    event.source.reset();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  stoppedDragging(event: CdkDragEnd, _div: HTMLDivElement) {
    event.source.element.nativeElement.classList.remove('hovering');
  }

  goToStudent(): void {
    this.router.stateService.go('projects/dashboard', {
      projectId: this.taskData.selectedTask.project.id,
      tutor: true,
      taskAbbr: '',
    });
  }

  public openPdfInNewTab(): void {
    if (this.pdfUrl) {
      this.fileDownloader.downloadFile(
        this.pdfUrl,
        `${this.taskData.selectedTask.definition.abbreviation}.pdf`,
      );
    }
  }
}
