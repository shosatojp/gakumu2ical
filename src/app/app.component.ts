import { Component, ViewChild, ElementRef } from '@angular/core';
import * as gakumu_parse from '../lib/gakumu_parse';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionPanel } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    gakumu_src = '';
    ical = '';
    classes: gakumu_parse.Class[] = [];
    day_of_weeks = '日月火水木金土';
    semester: gakumu_parse.Semester = gakumu_parse.semesters[0];
    semesters: gakumu_parse.Semester[] = gakumu_parse.semesters;

    displayedColumns: string[] = ['科目番号', '曜日', '時限', '教科', '教員'];
    @ViewChild('panelical') panelical: MatExpansionPanel;

    onChange(event) {
        this.gakumu_src = event.target.value;
        this.classes = gakumu_parse.parse_gakumu(this.gakumu_src);
        if (!this.classes.length) return;
        const events = gakumu_parse.instanciate(this.classes, this.semester);
        this.ical = gakumu_parse.make_ical(events);
        if (!this.ical.length) return;

        this.panelical.expanded = true;
    }

    create_ical() {
        console.log(this.gakumu_src);
        const classes = gakumu_parse.parse_gakumu(this.gakumu_src);
        if (!classes.length) {
            alert('失敗');
            return;
        }
        console.log(classes);
        const events = gakumu_parse.instanciate(classes, this.semester);
        this.ical = gakumu_parse.make_ical(events);
    }

    download() {
        const blob = new Blob([this.ical]);
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'risyu.ical';
        a.click();
    }
}
