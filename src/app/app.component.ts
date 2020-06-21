import { Component } from '@angular/core';
import * as gakumu_parse from '../lib/gakumu_parse';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'gakumu2ical';
    gakumu_src = '';
    ical = '';
    classes: gakumu_parse.Class[] = [];
    day_of_weeks = '日月火水木金土';

    onChange(event) {
        this.gakumu_src = event.target.value;
        this.classes = gakumu_parse.parse_gakumu(this.gakumu_src);
    }

    create_ical() {
        console.log(this.gakumu_src);
        const classes = gakumu_parse.parse_gakumu(this.gakumu_src);
        if (!classes.length) {
            alert('失敗');
            return;
        }
        console.log(classes);
        const events = gakumu_parse.instanciate(classes, gakumu_parse.semesters[0]);
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
