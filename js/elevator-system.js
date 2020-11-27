$(function () {
    set_building_configs_and_rebuild(floor_nums, elevator_nums)
});

function set_building_configs_and_rebuild(floor_nums, elevator_nums) {
    $('*').stop()
    create_elevators_objects(elevator_nums)
    set_outdoor_button_states(floor_nums)

    set_building_display(floor_nums, elevator_nums)
    set_panel_body(floor_nums, elevator_nums)

    set_indoor_switch_bind(floor_nums, elevator_nums)
    set_outdoor_switch_bind(floor_nums, elevator_nums)

    for (let eno = 1; eno <= elevator_nums; eno++) {
        elevators[eno].start()
    }
}


function create_elevators_objects(number_of_elevators) {
    elevator_nums = number_of_elevators
    let AI_mode_has_gone_to_first_floor = 0
    for (let i = 1; i <= elevator_nums; i++) {
        elevators[i] = {
            elevator_no: i,
            state: {
                now_floor_no: 1,
                now_direction: DIRECTION_STILL,// 1 up , 0 still , -1 down
                moving: 0,
                door_state: DOOR_CLOSED,
                auto_mode_state: AI_MODE_CLOSED,
                auto_mode_running_outer_event: undefined,
                indoor_switches: Array(floor_nums + 1).fill(OFF),
                indoor_activated_switches_num: 0
            },
            start: function () {
                this.start_waiting_to_launch_AI_mode()
            },
            set_now_floor_no: function (floor_no) {
                this.state.now_floor_no = floor_no
                set_indoor_floor_number_display(floor_no, this.elevator_no)
            },
            set_now_direction: function (direct) {
                this.state.now_direction = direct
                set_indoor_direction_display(this.elevator_no, direct)
            },
            check_AI_mode_and_callBack: function (callBack) {
                if (this.state.auto_mode_state === AI_MODE_RUNNING) {
                    let eno = this.elevator_no
                    this.state.auto_mode_running_outer_event = function () {
                        elevators[eno].log('running event ' + ' direct:')
                        callBack()
                    }
                    this.log(' check running' + this.state.auto_mode_running_outer_event)
                    this.set_now_direction(DIRECTION_AI_MODE_WAITING_FOR_CHANGING)
                } else if (this.state.auto_mode_state === AI_MODE_STARTING) {
                    let eno = this.elevator_no
                    controller_stop_waiting_for_timeout_and_callback(eno, function () {

                        elevators[eno].state.auto_mode_state = AI_MODE_CLOSED
                        callBack()
                    })
                } else {

                    callBack()
                }
            },
            need_direction: function (direct, inner_request = 0) {
                if (inner_request === 0 && this.state.now_direction === DIRECTION_STILL) {
                    let eno = this.elevator_no
                    this.check_AI_mode_and_callBack(function () {
                        elevators[eno].set_now_direction(direct)
                        if (DIRECTION_STILL === direct) { // indoor open door request
                            elevators[eno].on_reach_floor(elevators[eno].state.now_floor_no, 1)
                        } else {
                            elevators[eno].on_reach_floor(elevators[eno].state.now_floor_no, 0)
                        }
                    })
                    return
                }
                if (inner_request === 1) {
                    if (direct !== DIRECTION_STILL) {
                        let eno = this.elevator_no
                        this.check_AI_mode_and_callBack(function () {
                            elevators[eno].set_now_direction(direct)
                            elevators[eno].on_reach_floor(elevators[eno].state.now_floor_no)
                        })
                    } else {
                        this.set_now_direction(direct)
                        this.start_waiting_to_launch_AI_mode()

                    }
                }
            },
            start_waiting_to_launch_AI_mode: function () {
                if (enable_AI_mode === false) {
                    return
                }
                if (this.state.auto_mode_state !== AI_MODE_CLOSED) {
                    return
                }
                if (this.state.now_direction !== DIRECTION_STILL &&
                    this.moving !== false && this.state.door_state !== DOOR_CLOSED) {
                    return
                }
                this.log('AI mode starting ')
                this.state.auto_mode_state = AI_MODE_STARTING
                let eno = this.elevator_no
                controller_wait_for_timeout_and_callBack(this.elevator_no, AI_mode_start_waiting_time, function () {
                    elevators[eno].state.auto_mode_state = AI_MODE_RUNNING
                    set_indoor_direction_display(eno, DIRECTION_STILL)
                    elevators[eno].running_AI_mode()
                })
            }
            ,
            running_AI_mode: function () { //静止待定
                if (this.state.auto_mode_running_outer_event !== undefined) {
                    this.stop_AI_mode()
                    return
                }
                let eno = this.elevator_no
                let fno = this.state.now_floor_no
                let rand = randomNum(1, 300)
                this.log('run, rand:' + rand, 2)
                controller_wait_for_timeout_and_callBack(eno, rand, function () {

                    elevators[eno].log('AI mode running', 2)
                    // running and running
                    let has_elevator_of_floors = new Array(floor_nums + 2).fill(0)
                    has_elevator_of_floors[floor_nums + 1] = 1
                    for (let e = 1; e <= elevator_nums; e++) {
                        if (e !== eno) {
                            has_elevator_of_floors[elevators[e].state.now_floor_no] += 1
                        }
                    }
                    if (fno !== 1 && (has_elevator_of_floors[1] === 0 && AI_mode_has_gone_to_first_floor === 0)) {
                        AI_mode_has_gone_to_first_floor += 1
                        elevators[eno].move_down(
                            function () {
                                elevators[eno].set_now_floor_no(fno - 1)
                                controller_directly_go_to_floor(eno, fno - 1)
                                AI_mode_has_gone_to_first_floor -= 1

                                elevators[eno].running_AI_mode()
                            })

                        return
                    }
                    if (has_elevator_of_floors[1] === 0 && fno === 1) {
                        controller_wait_for_timeout_and_callBack(eno, 2000,
                            function () {
                                elevators[eno].running_AI_mode()
                            }
                        )
                        return
                    }
                    let free_intervals = []
                    let start = 1
                    let has = 1
                    elevators[eno].log('has_elevator_of_floors ' + has_elevator_of_floors.toString(), 2)

                    for (let fno = 1; fno <= floor_nums + 1; fno++) {
                        elevators[eno].log('fno:' + fno + ',' + 'start:' + start + ',has:' + has + 'now:' + has_elevator_of_floors[fno], 2)
                        if (has_elevator_of_floors[fno] === 0) {
                            if (has === 1) {
                                start = fno
                                has = 0
                            }
                        } else {
                            if (has === 0) {
                                free_intervals.push(
                                    {
                                        st: start,
                                        ed: fno - 1,
                                        len: fno - start,
                                    }
                                )
                                elevators[eno].log(' catch  st :' + start + ',ed :' + (fno - 1), 2)
                                has = 1
                            }
                        }
                    }
                    if (free_intervals.length === 0) {
                        controller_wait_for_timeout_and_callBack(eno, 2000,
                            function () {
                                elevators[eno].running_AI_mode()
                            }
                        )

                    } else {
                        let longest_index = -1
                        let longest_len = 0
                        let in_interval_index = -1
                        for (let i = 0; i < free_intervals.length; i++) {
                            elevators[eno].log('x.st:' + number_of_elevators.st + ',x.ed:' + number_of_elevators.ed, 2)
                            if (free_intervals[i].len > longest_len) {
                                longest_index = i
                                longest_len = free_intervals[i].len
                            }
                            if (fno >= free_intervals[i].st && fno <= free_intervals[i].ed) {
                                in_interval_index = i
                            }
                        }
                        const GO_TO_ERROR = 1
                        const INTERVAL_LEN_ERROR = 1
                        elevators[eno].log('lg_idx:' + longest_index + ',lg_len:' + longest_len + ',lg.st:' + free_intervals[longest_index].st, 2)
                        elevators[eno].log('in_index:' + in_interval_index, 2)
                        let go_to_interval_index = longest_index
                        if (in_interval_index !== -1 && longest_index !== in_interval_index && Math.abs(free_intervals[in_interval_index].len - free_intervals[longest_index].len) <= INTERVAL_LEN_ERROR) {
                            go_to_interval_index = in_interval_index
                        }
                        let go_to_mid = Math.floor((free_intervals[go_to_interval_index].st + free_intervals[go_to_interval_index].ed) / 2)
                        if (in_interval_index === -1 || (in_interval_index !== -1 && Math.abs(fno - go_to_mid) > GO_TO_ERROR)) {
                            if (go_to_mid > fno) {
                                elevators[eno].move_up(function () {
                                    elevators[eno].set_now_floor_no(fno + 1)
                                    controller_directly_go_to_floor(eno, fno + 1)
                                    elevators[eno].running_AI_mode()
                                })
                            } else {
                                elevators[eno].move_down(
                                    function () {
                                        elevators[eno].set_now_floor_no(fno - 1)
                                        controller_directly_go_to_floor(eno, fno - 1)

                                        elevators[eno].running_AI_mode()
                                    })
                            }
                        } else {
                            // setTimeout()
                            controller_wait_for_timeout_and_callBack(eno, 2000,
                                function () {
                                    elevators[eno].running_AI_mode()
                                }
                            )

                        }

                    }

                })
            },
            stop_AI_mode: function () {
                this.log('AI mode stoped')
                this.state.auto_mode_state = AI_MODE_CLOSED
                let callBack = this.state.auto_mode_running_outer_event
                this.state.auto_mode_running_outer_event = undefined
                this.set_now_direction(DIRECTION_STILL)
                if (callBack) callBack()
            },
            choose_floor_switch: function (floor_no) {
                return ext_choose_indoor_foor_switch(floor_no, this.elevator_no)
            },
            toggle_indoor_switch: function (floor_no) {
                let rev_state = ON
                if (this.state.indoor_switches[floor_no] === ON) {
                    rev_state = OFF
                }
                this.set_indoor_switch(floor_no, rev_state)
            },
            recent_opened_switches: new Queue(),
            detect_and_remove_anomaly: function () {
                if (this.recent_opened_switches.isEmpty()) {
                    return
                }
                let check_time = 3000
                let allowed_opened_switch_num = 4
                let newest_time = this.recent_opened_switches.back()['opened_time']
                while (!this.recent_opened_switches.isEmpty() && newest_time - this.recent_opened_switches.front()['opened_time'] > check_time) {
                    this.recent_opened_switches.pop()
                }
                if (this.recent_opened_switches.size() > allowed_opened_switch_num) {
                    this.recent_opened_switches.print()
                    while (!this.recent_opened_switches.isEmpty()) {
                        this.set_indoor_switch(this.recent_opened_switches.front()['floor_no'], OFF)
                        this.recent_opened_switches.pop()
                    }
                }
            },
            set_indoor_switch: function (floor_no, state) {
                let maximum_number_of_opened = 13
                if (this.state.indoor_switches[floor_no] === state) {
                    return
                }
                if (state === ON && this.state.indoor_activated_switches_num > maximum_number_of_opened) {
                    for (let fno = 1; fno <= floor_nums; fno++) {
                        if (this.state.indoor_switches[fno] === ON) this.set_indoor_switch(fno, OFF)
                    }
                    return
                }
                this.state.indoor_switches[floor_no] = state

                if (this.state.indoor_switches[floor_no] === ON) {
                    this.recent_opened_switches.push(
                        {
                            'floor_no': floor_no,
                            'opened_time': Date.now()
                        }
                    )
                    if (this.state.now_floor_no === floor_no) {
                        this.set_indoor_switch(floor_no, OFF)
                        return
                    }
                    this.detect_and_remove_anomaly()
                    if (this.state.indoor_switches[floor_no] === ON) {
                        set_indoor_floor_switch_state(floor_no, this.elevator_no, ON)
                        this.state.indoor_activated_switches_num += 1
                        if (this.state.now_direction === DIRECTION_STILL) {
                            if (floor_no > this.state.now_direction) {
                                this.need_direction(DIRECTION_UP, 1)
                            } else {
                                this.need_direction(DIRECTION_DOWN, 1)
                            }
                        }
                    }

                } else {
                    this.state.indoor_activated_switches_num -= 1
                    set_indoor_floor_switch_state(floor_no, this.elevator_no, OFF)
                }
            },
            log: function () {
                print_level = 3;
                return function (msg, level = 0) {

                    if (level >= print_level) console.log('[level:' + level + '] ' + 'eno: ' + this.elevator_no + " msg: " + msg)
                }
            }(),
            check_and_move: function (callBack) {// 已经处理了该楼层该方向上的请求，关门态
                this.time += 1
                this.log('check now :fno ' + this.state.now_floor_no + ' dir :' + this.state.now_direction + ' time: ' + this.time)
                if (this.state.now_direction === DIRECTION_STILL) {//indoor opened
                    this.start_waiting_to_launch_AI_mode()
                    if (callBack) callBack()
                    return
                }
                let direct = this.state.now_direction
                let floor_no = this.state.now_floor_no
                let direct_has_inner_requests = 0
                let direct_has_outter_requests = 0


                let request_floors = Array(floor_nums * 2 + 1).fill(0)
                let going_elevators = Array(floor_nums * 2 + 1).fill(0)
                for (let k = this.state.now_floor_no + this.state.now_direction; k >= 1 && k <= floor_nums; k += this.state.now_direction) {
                    if (this.state.indoor_switches[k] === ON) {
                        direct_has_inner_requests = 1
                        break
                    }
                    if (outdoor_buttons_state[k][DIRECTION_UP] === ON || outdoor_buttons_state[k][DIRECTION_DOWN] === ON) {
                        request_floors[k] = 1
                    }
                }
                for (let eno = 1; eno <= elevator_nums; eno++) {
                    if (eno !== this.elevator_no && elevators[eno].state.now_direction === direct) {
                        going_elevators[elevators[eno].state.now_floor_no] += 1
                    }
                }
                let now_enum = 0
                let now_fnum = 0
                let threash = 1.8
                for (let k = this.state.now_floor_no; k >= 1 && k <= floor_nums; k += this.state.now_direction) {
                    now_enum += going_elevators[k];
                    now_fnum += request_floors[k];
                    if (now_enum === 0 && now_fnum !== 0 || now_enum !== 0 && now_fnum / now_enum >= threash) {
                        direct_has_outter_requests = 1
                        break
                    }
                }
                this.log('direct' + direct + ' enum=' + now_enum + ' fnum=' + now_fnum)

                this.log(' dir has req ' + direct_has_inner_requests + ' outer ' + direct_has_outter_requests)

                if (direct_has_inner_requests || direct_has_outter_requests) {
                    let fno = this.state.now_floor_no
                    let eno = this.elevator_no
                    this.log(' now fno: ' + fno)
                    if (this.state.now_direction === DIRECTION_UP) {
                        this.move_up(function () {
                            if (callBack) callBack()
                            elevators[eno].on_reach_floor(fno + 1)
                        })
                    } else {
                        this.move_down(function () {
                            if (callBack) callBack()
                            elevators[eno].on_reach_floor(fno - 1)
                        })
                    }
                } else {


                    let rev_direct = DIRECTION_UP
                    if (this.state.now_direction === DIRECTION_UP) {
                        rev_direct = DIRECTION_DOWN
                    }


                    let rev_direct_has_inner_requests = 0
                    let rev_direct_has_outer_requests = 0

                    let request_floors = Array(floor_nums * 2 + 1).fill(0)
                    let going_elevators = Array(floor_nums * 2 + 1).fill(0)

                    for (let k = this.state.now_floor_no; k >= 1 && k <= floor_nums; k += rev_direct) {
                        if (this.state.indoor_switches[k] === ON) {
                            rev_direct_has_inner_requests = 1
                            break
                        }
                        if (outdoor_buttons_state[k][DIRECTION_UP] === ON || outdoor_buttons_state[k][DIRECTION_DOWN] === ON) {
                            request_floors[k] = 1
                        }
                    }

                    for (let eno = 1; eno <= elevator_nums; eno++) {
                        if (eno !== this.elevator_no && elevators[eno].state.now_direction === rev_direct) {
                            going_elevators[elevators[eno].state.now_floor_no] += 1
                        }
                    }
                    let now_enum = 0
                    let now_fnum = 0
                    let threash = 1.8
                    for (let k = this.state.now_floor_no; k >= 1 && k <= floor_nums; k += rev_direct) {
                        now_enum += going_elevators[k];
                        now_fnum += request_floors[k];
                        if (now_enum === 0 && now_fnum !== 0 || now_enum !== 0 && now_fnum / now_enum >= threash) {
                            rev_direct_has_outer_requests = 1
                            break
                        }
                    }

                    if (rev_direct_has_inner_requests || rev_direct_has_outer_requests) {
                        this.need_direction(rev_direct, 1)
                    } else {
                        this.need_direction(DIRECTION_STILL, 1)
                    }
                }

            },
            wait_for_closing: function (callBack) {
                this.log(' open wait ')
                console.assert(
                    this.state.door_state === DOOR_OPENED)
                this.state.door_state = DOOR_OPENED
                let eno = this.elevator_no
                controller_wait_for_timeout_and_callBack(this.elevator_no, waiting_for_enter_duration,
                    function () {
                        // elevators[eno].state.opened = 0
                        callBack()
                    }
                )
            },
            skip_waiting_for_closing: function (callBack) {
                this.log('skip open wait ')
                if (this.state.door_state !== DOOR_OPENED) {
                    return
                }
                let eno = this.elevator_no

                controller_stop_waiting_for_timeout_and_callback(this.elevator_no, function () {
                    elevators[eno].state.door_state = DOOR_CLOSING
                    elevators[eno].close_door(function () {
                        elevators[eno].state.door_state = DOOR_CLOSED
                        elevators[eno].check_and_move()
                    })
                })
            },
            ignore_on_reach_floor_request: 0,
            on_reach_floor: function (floor_no, has_open_request) {
                this.log('on reach ' + floor_no)
                this.set_now_floor_no(floor_no)
                controller_directly_go_to_floor(this.elevator_no, this.state.now_floor_no)
                if (has_open_request === 1 || outdoor_buttons_state[floor_no][this.state.now_direction] === ON || this.state.indoor_switches[floor_no] === ON) {
                    set_outdoor_switch(floor_no, this.state.now_direction, OFF)
                    let eno = this.elevator_no
                    this.set_indoor_switch(floor_no, OFF)
                    this.open_door(function () {
                        elevators[eno].wait_for_closing(function () {
                            elevators[eno].close_door(function () {
                                elevators[eno].check_and_move(
                                    function () {
                                        // elevators[eno].ignore_on_reach_floor_request=0
                                    }
                                )
                            })
                        })
                    })
                } else {
                    let eno = this.elevator_no
                    if (this.state.door_state === DOOR_CLOSED && this.state.moving === 0)
                        this.check_and_move(
                            function () {
                                // elevators[eno].ignore_on_reach_floor_request=0
                            })
                }
            },
            change_floor: function (floor_no) {
                controller_directly_go_to_floor(this.elevator_no, floor_no)
                this.set_now_floor_no(floor_no)
            },
            close_door: function (callBack) {
                this.log('close door')
                this.state.door_state = DOOR_CLOSING
                let eno = this.elevator_no
                controller_close_door(this.state.now_floor_no, this.elevator_no, function () {
                    elevators[eno].state.door_state = DOOR_CLOSED

                    callBack()
                })
            },
            stop_closing_door: function () {
                this.log(' stop closing')
                if (this.state.door_state !== DOOR_CLOSING) {
                    return
                }
                let eno = this.elevator_no
                controller_stop_closing_door(this.state.now_floor_no, this.elevator_no, function () {
                    elevators[eno].open_door(function () {
                        elevators[eno].wait_for_closing(
                            function () {
                                elevators[eno].close_door(
                                    function () {
                                        elevators[eno].check_and_move()
                                    }
                                )
                            }
                        )
                    })
                })

            },
            handle_open_door_button_pressed: function () {
                let eno = this.elevator_no
                if (elevators[eno].state.moving === 1) {

                } else if (elevators[eno].state.door_state === DOOR_CLOSING) {
                    elevators[eno].stop_closing_door()
                } else if (elevators[eno].state.door_state === DOOR_CLOSED && elevators[eno].state.now_direction === DIRECTION_STILL) {
                    elevators[eno].need_direction(DIRECTION_STILL)
                }
            },
            open_door: function (callBack) {
                this.log('open door')
                if (this.state.door_state !== DOOR_CLOSED &&
                    this.state.door_state !== DOOR_CLOSING) return
                this.state.door_state = DOOR_OPENING
                let eno = this.elevator_no
                controller_open_door(this.state.now_floor_no, this.elevator_no, function () {
                    elevators[eno].state.door_state = DOOR_OPENED
                    callBack()
                })
            },
            move_up: function (callBack) {
                this.log("move up")
                this.state.moving = 1
                let eno = this.elevator_no
                controller_move_up(this.elevator_no, function () {
                    elevators[eno].state.moving = 0
                    callBack()
                })
            },
            move_down: function (callBack) {
                this.log("move down")
                this.state.moving = 1
                let eno = this.elevator_no
                controller_move_down(this.elevator_no, function () {
                    elevators[eno].state.moving = 0
                    callBack()
                })
            }
        }
    }
}

function toggle_AI_mode() {
    enable_AI_mode = !enable_AI_mode
    if (enable_AI_mode) {
        ext_set_is_AI_mode_enabled(enable_AI_mode)
        for (let eno = 1; eno <= elevator_nums; eno++) {
            if (elevators[eno].state.auto_mode_state === AI_MODE_CLOSED) {
                elevators[eno].start_waiting_to_launch_AI_mode();
            }
        }
    } else {
        ext_set_is_AI_mode_enabled(enable_AI_mode)
        for (let eno = 1; eno <= elevator_nums; eno++) {
            if (elevators[eno].state.auto_mode_state !== AI_MODE_CLOSED) {
                elevators[eno].check_AI_mode_and_callBack(
                    function () {
                        elevators[eno].need_direction(DIRECTION_STILL, 1)
                    }
                )
            }
        }
    }

}


function check_and_change_elevators_position(change_function) {
    for (let i = 1; i <= elevator_nums; i++) {
        if (elevators[i].state.now_direction !== DIRECTION_STILL || elevators[i].state.moving !== 0 || elevators[i].state.door_state !== DOOR_CLOSED) {
            return
        }
    }
    change_function()
}

function elevators_position_half_one_half_distribution() {
    check_and_change_elevators_position(
        function () {
            if (elevator_nums === 1) {
                elevators[1].check_AI_mode_and_callBack(
                    function () {
                        elevators[1].change_floor(1)
                        elevators[1].start_waiting_to_launch_AI_mode()
                    }
                )

            } else {
                let mid = Math.floor(elevator_nums / 2)
                let st = elevator_nums - mid + 1
                let avelength = Math.floor(floor_nums / mid)
                let now_floor = floor_nums
                for (let eno = elevator_nums; eno >= st; eno--) {

                    elevators[eno].check_AI_mode_and_callBack(
                        function () {
                            elevators[eno].change_floor(now_floor)

                        })
                    now_floor -= avelength
                    if (now_floor < 1) now_floor = 1
                }
                for (let k = st - 1; k >= 1; k--) {
                    elevators[eno].check_AI_mode_and_callBack(
                        function () {
                            elevators[k].change_floor(1)
                        })
                }
            }
        }
    )

}

function elevators_position_all_one() {
    check_and_change_elevators_position(
        function () {
            for (let eno = 1; eno <= elevator_nums; eno++) {
                elevators[eno].change_floor(1)
            }
        }
    )
}

function set_outdoor_button_states(number_of_floors) {
    floor_nums = number_of_floors
    for (let i = 1; i <= floor_nums; i++) {
        outdoor_buttons_state[i] = []
        outdoor_buttons_state[i][DIRECTION_UP] = outdoor_buttons_state[i][DIRECTION_DOWN] = OFF
    }
}

function dispatch_request(floor_no, direct) {
    let rev_direct = DIRECTION_UP
    if (direct === DIRECTION_UP) {
        rev_direct = DIRECTION_DOWN
    }
    let has_already = 0
    let closing = 0
    let closing_threshold = 5
    for (let eno = 1; eno <= elevator_nums; eno++) {
        if (elevators[eno].state.now_floor_no === floor_no && (elevators[eno].state.now_direction === DIRECTION_STILL || elevators[eno].state.now_direction === direct)) {
            if (elevators[eno].state.now_direction === DIRECTION_STILL) {
                elevators[eno].need_direction(direct)
                return
            } else if (elevators[eno].state.now_direction === direct) {
                if (elevators[eno].state.moving === 0) {
                    // toggle_outdoor_switch(floor_no,direct)
                    if (elevators[eno].state.door_state === DOOR_CLOSING) {
                        elevators[eno].stop_closing_door()
                    } else {
                        toggle_outdoor_switch(floor_no, direct)
                    }
                    return
                }
            }
        }
        if (direct === DIRECTION_UP && elevators[eno].state.now_floor_no < floor_no && elevators[eno].state
            .now_direction === DIRECTION_UP) {
            has_already = 1
            if (floor_no - elevators[eno].state.now_floor_no <= closing_threshold) closing = 1
        } else if (direct === DIRECTION_DOWN && elevators[eno].state > floor_no &&
            elevators[eno].state.now_direction === direct) {
            has_already = 1
            if (elevators[eno].state.now_floor_no - floor_no <= closing_threshold) closing = 1
        }
    }
    let ok = 0
    if (direct === DIRECTION_UP) {
        let uppest_eno = -1
        let uppest_floor = -1
        for (let eno = 1; eno <= elevator_nums; eno++) {
            if (elevators[eno].state.now_floor_no < floor_no && (elevators[eno].state.now_direction === DIRECTION_STILL/* || elevators[eno].state.now_direction === DIRECTION_UP*/)) {

                if (elevators[eno].state.now_floor_no > uppest_floor) {
                    uppest_floor = elevators[eno].state.now_floor_no
                    uppest_eno = eno
                }
            }
        }
        if (uppest_eno !== -1) {
            elevators[uppest_eno].need_direction(DIRECTION_UP)
            ok = 1
        }
    } else {
        let lowest_floor = floor_nums + 2
        let lowest_eno = -1
        for (let eno = 1; eno <= elevator_nums; eno++) {
            if (elevators[eno].state.now_floor_no > floor_no && (elevators[eno].state.now_direction === DIRECTION_STILL/* || elevators[eno].state.now_direction === DIRECTION_DOWN*/)) {
                if (elevators[eno].state.now_floor_no < lowest_floor) {
                    lowest_floor = elevators[eno].state.now_floor_no
                    lowest_eno = eno
                }
            }
        }
        if (lowest_eno !== -1) {
            ok = 1
            elevators[lowest_eno].need_direction(DIRECTION_DOWN)
        }
    }
    if (ok) {
        return
    }
    if (direct === DIRECTION_UP) {
        let lowest_floor = floor_nums + 2
        let lowest_eno = -1
        for (let eno = 1; eno <= elevator_nums; eno++) {
            if (elevators[eno].state.now_floor_no > floor_no && (elevators[eno].state.now_direction === DIRECTION_STILL/* || elevators[eno].state.now_direction === DIRECTION_DOWN*/)) {
                if (elevators[eno].state.now_floor_no < lowest_floor) {
                    lowest_floor = elevators[eno].state.now_floor_no
                    lowest_eno = eno
                }
            }
        }
        if (lowest_eno !== -1) {
            ok = 1
            elevators[lowest_eno].need_direction(DIRECTION_DOWN)
        }
    } else {
        let uppest_eno = -1
        let uppest_floor = -1
        for (let eno = 1; eno <= elevator_nums; eno++) {
            if (elevators[eno].state.now_floor_no < floor_no && (elevators[eno].state.now_direction === DIRECTION_STILL/* || elevators[eno].state.now_direction === DIRECTION_UP*/)) {

                if (elevators[eno].state.now_floor_no > uppest_floor) {
                    uppest_floor = elevators[eno].state.now_floor_no
                    uppest_eno = eno
                }
            }
        }
        if (uppest_eno !== -1) {
            elevators[uppest_eno].need_direction(DIRECTION_UP)
            ok = 1
        }
    }
    console.assert(ok)

}