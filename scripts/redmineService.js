/* redmineService.js */
(function(win){

    /* conf : {
        redmineUrl :  <redmine protocol and host/ip>
        apiKey : <user api key>
    }
    */
    var svc = function(conf){
        var requestDefaults = {
            crossDomain : true,
            headers : { 'X-Redmine-API-Key' : conf.apiKey }
        };

        var tracker = { bug : 1, feature : 2 };

        var priority = {
            'low':3,
            'normal':4,
            'high':5,
            'urgent':6,
            'immediate':7
        };

        var status = {
            'new' : 1,
            'assigned' : 2,
            'in progress' : 8,
            'resolved' : 3,
            'approved' : 4,
            'closed' : 5,
            'rejected' : 6,
            'blocked' : 7
        };

        return {
            getUser : function(){
                var reqConf = requestDefaults;
                reqConf.url = conf.redmineUrl + '/users/current.json?include=memberships';
                reqConf.method = 'GET';
                return this.sendRequest(reqConf);
            },

            createBug : function(info){
                info.tracker_id = 1;
                return redmineService.createIssue(info);
            },

            createFeatureRequest(info){
                info.tracker_id = 2;
                return redmineService.createIssue(info);
            },

            createIssue : function(info){
                var reqConf = requestDefaults;
                reqConf.url = conf.redmineUrl + '/issues.json';
                reqConf.method = 'POST';
                reqConf.data = {
                    issue : {
                        project_id : info.project_id,
                        status_id : status.new,

                        tracker_id : info.tracker_id,
                        priority_id : info.priority_id,
                        fixed_version_id : info.fixed_version_id,
                        subject : info.subject,
                        description : info.description
                    }
                };
                return this.sendRequest(reqConf);
            },

            getBugs : function(projectId){
                return redmineService.getIssues(projectId, 1);
            },
            getFeatureRequests : function(projectId){
                return redmineService.getIssues(projectId, 2);
            },

            getIssues : function(projectId, trackerId){
                var reqConf = requestDefaults;
                reqConf.url = conf.redmineUrl + '/issues.json?project_id=' +
                        projectId + '&tracker_id=' + trackerId;
                reqConf.method = 'GET';
                return this.sendRequest(reqConf);
            },

            sendRequest : function(reqConf){
                return jQuery.ajax(reqConf)
                    .done(function(data){
                        return data;
                    })
                    .fail(function(jqXHR, textStatus, errorThrown){
                        console.error(errorThrown);
                    });
            }
        };
    };
    win.RedmineService = svc;

})(window);
