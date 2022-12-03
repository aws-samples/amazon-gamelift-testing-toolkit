// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";
import {Utils} from "../../Utils/Utils";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import {DataTypes} from "../../Data/DataTypes";
import VirtualPlayerTaskSchedule = DataTypes.VirtualPlayerTaskSchedule;
import VirtualPlayerTasksQuotas = DataTypes.VirtualPlayerTasksQuotas;
import VirtualPlayerTaskScheduleAction = DataTypes.VirtualPlayerTaskScheduleAction;
import {PageManager} from "./PageManager";

export class VirtualPlayerTaskSchedulesForm extends Page
{
    public static id = Pages.VIRTUAL_PLAYER_TASK_SCHEDULES_FORM;
    public static cacheKey = "virtualPlayerTaskSchedulesForm";
    protected _schedule: VirtualPlayerTaskSchedule = {};
    protected _quotaInfo: VirtualPlayerTasksQuotas = {};

    public constructor (parentPage:Page=null)
    {
        super(VirtualPlayerTaskSchedulesForm.cacheKey, parentPage, VirtualPlayerTaskSchedulesForm.id);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.hasClass("refreshButton"))
        {
            this.refresh();
        }

        if (el.attr("id")=="backButton") // show requests list
        {
            this.goBack();
        }

        if (el.attr("id")=="createSchedule") // show requests list
        {
            this.createSchedule();
        }
    }

    createSchedule = () =>
    {
        if (this.validateForm())
        {
            if (this._schedule.ScheduleName.length<2)
            {
                this.showFailureAlert("You must enter a name for the schedule");
                return false;
            }

            Network.sendObject({Type:"CreateVirtualPlayerTaskSchedule", Schedule: this._schedule})
        }
    }

    validateForm = () =>
    {
        this._schedule={};
        let errors=[];
        let errorsFound=0;
        const scheduleName = $("#scheduleName").val() as string;
        this._schedule.ScheduleName = scheduleName;

        const launchTime = parseInt($("#taskLaunchTime").val() as string);
        $("#taskLaunchTime").val(launchTime);
        if (launchTime<5 || launchTime>60)
        {
            errorsFound++;
            errors.push("Task launch time must be 5-60 minutes");
        }
        else
        {
            $('#taskLaunchTimeError').html("");
            this._schedule.LaunchTime = launchTime;
        }

        const terminationTime = parseInt($("#taskTerminationTime").val() as string);
        $("#taskTerminationTime").val(terminationTime);
        if (terminationTime<5 || terminationTime>60)
        {
            errorsFound++;
            errors.push("Task termination time must be 5-60 minutes");
        }
        else
        {
            $('#taskTerminationTimeError').html("");
            this._schedule.TerminationTime = terminationTime;
        }

        const numTasks = parseInt($("#numTasks").val() as string);
        $("#numTasks").val(numTasks);
        if (numTasks<2 || numTasks>1000)
        {
            errorsFound++;
            errors.push("Must launch 2-1000 tasks per schedule");
        }
        else
        {
            $('#numTasksError').html("");
            this._schedule.NumTasks = numTasks;
        }

        const schedulePeriod = parseInt($('#schedulePeriod').val() as string);
        if (schedulePeriod<1 || schedulePeriod>60)
        {
            errorsFound++;
            errors.push("Must launch tasks every 1-60 minutes");
        }
        else
        {
            $('#numTasksError').html("");
            this._schedule.SchedulePeriodMinutes = schedulePeriod;
        }

        if (errorsFound==0)
        {
            this.hideStatusAlert();
            $(".createScheduleButtons").show();
            this.updateScheduleTable();
            return true;
        }
        else
        {
            this.showFailureAlert(errors.join("<br/>"));
            $(".createScheduleButtons").hide();
            return false;
        }
    };

    updateScheduleTable = () =>
    {
        this.resetElement(".virtualPlayerTaskScheduleTableContainer");

        this._schedule.SchedulePeriodMinutes = parseInt($('#schedulePeriod').val() as string);

        let numPeriods = Math.floor(this._schedule.LaunchTime / this._schedule.SchedulePeriodMinutes);
        if (numPeriods==0)
        {
            numPeriods=1;
        }
        this._schedule.PercentageIncrease = parseFloat($('#schedulePercentageIncrease').val() as string);

        let maxTotalTasks = Math.max(this._quotaInfo.RunningFargateOnDemandVcpu, this._quotaInfo.RunningFargateSpotVcpu);

        let scheduleMaxed=false;

        const schedule:VirtualPlayerTaskScheduleAction[] = [];

        let previousTasksScheduled=0;
        let taskNum=1;
        let totalTasks=0;
        let lastLaunchTime=0;
        for (let i=1; i<=numPeriods; i++)
        {
            let tasksToRun = this._schedule.NumTasks;
            if (this._schedule.PercentageIncrease>0.00)
            {
                tasksToRun = (previousTasksScheduled!=0) ? Math.round (previousTasksScheduled + (previousTasksScheduled*this._schedule.PercentageIncrease)) : this._schedule.NumTasks;
            }

            if (tasksToRun>this._quotaInfo.RatePerMinute)
            {
                tasksToRun = this._quotaInfo.RatePerMinute;
                scheduleMaxed=true;
            }

            if (totalTasks+tasksToRun >= maxTotalTasks)
            {
                tasksToRun = maxTotalTasks-totalTasks;
                scheduleMaxed=true;
            }

            if (tasksToRun>0)
            {
                const action:VirtualPlayerTaskScheduleAction = {
                    Type: "Launch",
                    Minutes: taskNum * this._schedule.SchedulePeriodMinutes,
                    NumTasks: tasksToRun
                };
                lastLaunchTime = action.Minutes;
                schedule.push(action);
                taskNum++;
                previousTasksScheduled = tasksToRun;
                totalTasks += tasksToRun;
            }
        }

        schedule.push({
            Type: "Terminate",
            Minutes: lastLaunchTime + this._schedule.TerminationTime,
            NumTasks: totalTasks,
        });

        this._schedule.Actions = schedule;

        let runningTotal=0;

        let tableHtml="";
        schedule.map(action =>
        {
            if (action.Type=="Launch")
            {
                runningTotal += action.NumTasks;
            }
            else
            if (action.Type=="Terminate")
            {
                runningTotal -= action.NumTasks;
            }

            tableHtml += '<tr><td>' + Utils.formatMinutesToTime(action.Minutes) + '</td><td>' + action.Type + '</td><td>' + action.NumTasks + ' tasks</td><td>' + runningTotal + '</td></tr>';
        });

        if (scheduleMaxed)
        {
            $("p.limitsHitText").html("NOTE - your schedule has been adjusted in accordance with your service quotas");
        }
        else
        {
            $("p.limitsHitText").html("");

        }

        $("table#virtualPlayerTaskScheduleTable tbody").append(tableHtml);

        this.activateDataTable("virtualPlayerTaskScheduleTable", {
            scrollY: "280px",
            dom: "ti",
            paging: false,
            scrollCollapse: true,
            columnDefs: [
                {width: 200, targets: 0}
            ],
            order: [[0, "asc"]],
            ordering: false,
        });

        console.log(schedule);
    }

    public setPageData(data:any)
    {
    }

    refresh()
    {
    }

    initPage()
    {
        $("#scheduleName").val("");
        Network.sendObject({Type:"GetVirtualPlayerTaskQuotas"});
    }

    setupEventListeners()
    {
        this._emitter.on(Events.GET_VIRTUAL_PLAYER_TASK_QUOTAS_RESPONSE, this.onGetVirtualPlayerTaskQuotasResponse);
        this._emitter.on(Events.CREATE_VIRTUAL_PLAYER_TASK_SCHEDULE_RESPONSE, this.onCreateVirtualPlayerTaskScheduleResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_VIRTUAL_PLAYER_TASK_QUOTAS_RESPONSE, this.onGetVirtualPlayerTaskQuotasResponse);
        this._emitter.off(Events.CREATE_VIRTUAL_PLAYER_TASK_SCHEDULE_RESPONSE, this.onCreateVirtualPlayerTaskScheduleResponse);
    }

    onCreateVirtualPlayerTaskScheduleResponse = (data) =>
    {
        if (data.Created==true)
        {
            PageManager.switchPage(Pages.VIRTUAL_PLAYER_TASK_SCHEDULES_TABLE);
        }
        else
        {
            this.showFailureAlert(data.ErrorMessage)
        }
    };

    onGetVirtualPlayerTaskQuotasResponse = (data) =>
    {
        this._quotaInfo = data.Quotas;
        $("p.quotaText").html("Your service quotas allow a maximum of <b>" + data.Quotas.RunningFargateOnDemandVcpu + "</b> On-Demand vCPUs and <b>" + data.Quotas.RunningFargateSpotVcpu + "</b> Spot vCPUs.  Maximum <b>" + data.Quotas.RatePerMinute + "</b> task launches per minute.");
        this.validateForm();
        $("#scheduleName").on("change", this.validateForm);
        $("#numTasks").on("change", this.validateForm);
        $("#scheduleType").on("change", this.validateForm);
        $("#schedulePeriod").on("change", this.validateForm);
        $("#taskLaunchTime").on("change", this.validateForm);
        $("#taskTerminationTime").on("change", this.validateForm);
        $("#schedulePercentageIncrease").on("change", this.validateForm);
    };

    setupPage()
    {
    }

}