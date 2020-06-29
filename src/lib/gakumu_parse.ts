export interface Class {
    classnum: number;
    subject: string;
    teachers: string;
    period: number;
    day_of_week: number;
}

export function parse_gakumu(src) {
    let classes: Class[] = [];
    let re: RegExp = /(\d)限/;
    let current_period = 0;
    let day_of_week = 1;
    let lines = src.split('\n');
    let i = 0;
    while (1) {
        let period: number = Number(re.exec(lines[i])?.[1] || '0');
        if (period) {
            i++;
            current_period = period;
            day_of_week = 1;
            continue;
        }

        let classnum: number = Number(new RegExp(/\d{8}/).exec(lines[i]) || '0');
        if (classnum) {
            i++;
            classes.push({
                classnum,
                subject: lines[i++],
                teachers: lines[i++],
                period: current_period,
                day_of_week: day_of_week++,
            });
            continue;
        }

        if (/未登録/.test(lines[i])) {
            i++;
            day_of_week++;
            continue;
        }

        if (i++ >= lines.length - 1) break;
    }

    classes = classes.sort((a, b) => a.period - b.period);
    classes = classes.sort((a, b) => a.day_of_week - b.day_of_week);
    return classes;
}

export interface Semester {
    id: number,
    year: number,
    semester: string,
    description: string,
    start: Date,
    end: Date,
    dayoff: Date[],
}

export function equal_date(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear()
        && d1.getMonth() === d2.getMonth()
        && d1.getDate() === d2.getDate();
}

export const semesters: Semester[] = [{
    id: 0,
    year: 2020,
    semester: '前期',
    description: 'K課程以外',
    start: new Date(2020, 5 - 1, 7),
    end: new Date(2020, 9 - 1, 11),
    dayoff: [
        new Date("2020-08-10T00:00:00"),
        new Date("2020-08-18T00:00:00"),
        new Date("2020-08-19T00:00:00"),
        new Date("2020-08-20T00:00:00"),
        new Date("2020-08-21T00:00:00"),
        new Date("2020-08-22T00:00:00"),
        new Date("2020-08-23T00:00:00"),
        new Date("2020-08-24T00:00:00"),
        new Date("2020-08-25T00:00:00"),
        new Date("2020-08-27T00:00:00"),
        new Date("2020-08-29T00:00:00"),
    ]
}, {
    id: 1,
    year: 2020,
    semester: '前期',
    description: 'K課程',
    start: new Date(2020, 5 - 1, 7),
    end: new Date(2020, 9 - 1, 11),
    dayoff: [
        new Date("2020-08-10T00:00:00"),
        new Date("2020-08-19T00:00:00"),
        new Date("2020-08-20T00:00:00"),
        new Date("2020-08-21T00:00:00"),
        new Date("2020-08-22T00:00:00"),
        new Date("2020-08-23T00:00:00"),
        new Date("2020-08-24T00:00:00"),
        new Date("2020-08-25T00:00:00"),
        new Date("2020-08-27T00:00:00"),
        new Date("2020-08-28T00:00:00"),
        new Date("2020-08-29T00:00:00"),
    ]
}];

export function set_period_time(date: Date, period: number) {
    const t = [
        [9, 0],
        [10, 40],
        [13, 0],
        [14, 40],
        [16, 15],
    ][period - 1];
    date.setHours(t[0]);
    date.setMinutes(t[1]);
    return date
}

export function zero_padding(n: number, w: number) {
    return ('0'.repeat(w) + n).slice(-w);
}

export function to_iso_ical_string(date: Date) {
    return `${date.getUTCFullYear()}${zero_padding(date.getUTCMonth() + 1, 2)}${zero_padding(date.getUTCDate(), 2)}T${zero_padding(date.getUTCHours(), 2)}${zero_padding(date.getUTCMinutes(), 2)}${zero_padding(date.getUTCSeconds(), 2)}Z`;
}




export function instanciate(classes: Class[], semester: Semester) {
    let until = new Date(semester.end);
    until.setDate(until.getDate() + 1);
    let events = [];

    for (const cls of classes) {
        let start = new Date(semester.start.getFullYear(), semester.start.getMonth(),
            semester.start.getDate() + ((cls.day_of_week - semester.start.getDay()) % 7 + 7) % 7);
        let exdates = [];
        for (let date = new Date(start);
            new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7) < semester.end;
            date.setDate(date.getDate() + 7)) {

            if (semester.dayoff.filter(e => equal_date(e, date)).length) {
                exdates.push(new Date(date));
            }
        }

        let endtime = set_period_time(new Date(start), cls.period);
        endtime.setMinutes(endtime.getMinutes() + 90);
        const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        events.push({
            DTSTART: to_iso_ical_string(set_period_time(new Date(start), cls.period)),
            DTEND: to_iso_ical_string(endtime),
            SUMMARY: cls.subject,
            DESCRIPTION: cls.classnum + ' ' + cls.teachers,
            RRULE: `FREQ=WEEKLY;WKST=SU;UNTIL=${to_iso_ical_string(until)};BYDAY=${days[cls.day_of_week]}`,
            EXDATE: exdates.map(e => to_iso_ical_string(set_period_time(e, cls.period))).join(',')
        });
    }

    return events;

}


export function make_ical(events) {
    let events_str = events.map(e => ['BEGIN:VEVENT', ...Object.keys(e).map(k => `${k}:${e[k]}`), 'END:VEVENT'].join('\n')).join('\n');
    return `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:test
X-WR-TIMEZONE:Asia/Tokyo
BEGIN:VTIMEZONE
TZID:Asia/Tokyo
X-LIC-LOCATION:Asia/Tokyo
BEGIN:STANDARD
TZOFFSETFROM:+0900
TZOFFSETTO:+0900
TZNAME:JST
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
${events_str}
END:VCALENDAR`
}


// let src = fs.readFileSync('src/lib/input.txt', { encoding: 'utf-8' });
// let classes = parse_gakumu(src);
// let events = instanciate(classes, semesters[0]);
// console.log(make_ical(events));