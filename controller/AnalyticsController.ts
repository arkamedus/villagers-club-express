import * as express from 'express';
import {isAuthenticated} from "../util/Auth";
import {db} from "../index";
import moment = require("moment");

class AnalyticsController {

    constructor(app) {
        this.intializeRoutes(app);
    }

    public intializeRoutes(app) {

        app.get('/analytics', isAuthenticated, this.getAnalytics);

    }

    getAnalytics = (request: express.Request, response: express.Response, next) => {


        if (!request.user || request.user.rank <= 8) {
            return next();
        }

        let data = [];
        let timescale = 60 * 60 * 24;
        let entry_dates = [];

        function ts(time) {
            return ((time / timescale) | 0) * timescale;
        }

        db.find('user', {}).then((users: any) => {

            let first_entry_date = ts(moment().unix());
            users.forEach((user) => {
                if (user.vc_registration_date) {
                    if (user.vc_registration_date < first_entry_date) {
                        first_entry_date = ts(user.vc_registration_date);
                    }
                }
            });

            let now = ts(moment().unix());

            for (let i = first_entry_date; i <= now; i += timescale) {
                entry_dates[i] = 0;
            }

            users.forEach((user) => {
                // data.push()
                if (user.vc_registration_date) {
                    entry_dates[ts(user.vc_registration_date)] += 1;
                }
            });

            for (let i = first_entry_date; i <= now; i += timescale) {
                data.push({
                    date: i*1000,
                    value: entry_dates[i]
                })
            }

            response.render('analytics/index', {
                data: JSON.stringify(data)
            });

        });


    };


}

export default AnalyticsController;