jQuery(document).ready(function(){
    jQuery('#redmineConnector .reset').on('click', function(){
        QrmTestSuite.clearRedmineConfiguration();
        document.location.reload();
    });

    QrmTestSuite.getRedmineConfiguration(function(config){
        if(config){
            QrmTestSuite.redmineService = new RedmineService({
                apiKey : config.apiKey,
                redmineUrl : config.redmineUrl
            });

            QrmTestSuite.redmineService.getUser()
            .done(function(data){
                if(data.user){
                    QrmTestSuite.redmineUser = data.user;
                    jQuery('#redmineConnector .account').text('Welcome, ' + data.user.login);
                    jQuery('#redmineConnector .reset').show();

                    if(!config.projectId){
                        var mems = data.user.memberships;
                        var projectArr = mems.map(function(mem){
                            return '* ' + mem.project.name + ': ' + mem.project.id;
                        });
                        var projectIdList = projectArr.join("\n");

                        var projectId = prompt("Enter a project id from the list below:\n" + projectIdList);
                        if(projectId && !isNaN(projectId)){
                            config.projectId = projectId;
                            localStorage.redmineConfiguration = JSON.stringify(config);
                        }
                        else{
                            alert('You have not set a project ID, so you will not be able to use the Redmine integration');
                        }
                    }
                }
            });
        }
    });

    // note: can't use ? delimiter is removed on motusan due to url rewriting
    // if pico site path is changed, this hard-coded delimiter must be changed too
    if(decodeURIComponent(document.location.toString()).indexOf("praxis/test_suite/logbug") != -1){
        QrmTestSuite.logBug(document.location);
    }
});

var QrmTestSuite = {
    // Pass the config to the callback:
    // { redmineUrl : '//www.hostedredmine.com', apiKey : 'key'}
    getRedmineConfiguration : function(cb){
        var config = {};
        if(localStorage.redmineConfiguration){
            return cb(JSON.parse(localStorage.redmineConfiguration));
        }

        if(!localStorage.askedForRedmineConfiguration){
            localStorage.askedForRedmineConfiguration = true;

            var settingPrompts = {
                redmineUrl : 'Enter the address of your Redmine server (e.g., //www.hostedredmine.com)',
                apiKey : 'Enter your Redmine API key'
            };

            for(var settingName in settingPrompts){
                var response = prompt(settingPrompts[settingName]);
                if(response){
                    config[settingName] = response;
                }
                else{
                    // all settings are required, if any are blank, return false
                    return cb(false);
                }
            }
            localStorage.redmineConfiguration = JSON.stringify(config);
        }

        if(!config.apiKey || !config.redmineUrl){
            cb = false;
        }
        return cb(config);
    },

    logBug : function(location){
        var config = JSON.parse(localStorage.redmineConfiguration);
        var testUrl = decodeURIComponent(location.hash.substr(1));
        // note: using "pico" as delimiter because ? is removed on motusan due to url rewriting
        // if pico site path is changed, this hard-coded delimiter must be changed too
        var subjectPrefix = testUrl.split('pico')[1].split('/').slice(-4).join('/');
        var descSuffix = 'Test case: ' + testUrl;
        jQuery('#frmSubject').val(subjectPrefix + ': <short description>');
        jQuery('#frmDescription').val("<long description and steps to reproduce>\n\n" + descSuffix);
        jQuery('button.btn-submit').on('click', function(ev){
            var subj = jQuery('#frmSubject').val();
            var desc = jQuery('#frmDescription').val();
            var priority = jQuery('#frmPriority').val();
            var version = jQuery('#frmVersion').val();
            var tracker = jQuery('#frmTracker').val();

            QrmTestSuite.redmineService.createIssue({
                tracker_id : tracker,
                subject : subj,
                description : desc,
                fixed_version_id :version,
                priority_id : priority,
                project_id : config.projectId
            })
            .done(function(data){
                if(data.issue){
                    alert("Your issue was logged. To view it in Redmine, go to:\n\n" +
                            JSON.parse(localStorage.redmineConfiguration).redmineUrl +
                            '/issues/' + data.issue.id);
                    window.location = testUrl;
                }
                else{
                    alert('An error occurred! Your issue could not be logged');
                    console.error(data);
                }
            });
            ev.stopPropagation();
            return false;
        });
        jQuery('a.btn-cancel').on('click', function(){
            history.back();
        })
    },

    clearRedmineConfiguration : function(){
        delete localStorage.redmineConfiguration;
        delete localStorage.askedForRedmineConfiguration;
        jQuery('#redmineConnector .reset').hide();
    }
};
