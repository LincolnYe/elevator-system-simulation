function set_building_display(floor_nums, elevator_nums) {
    $('#elevator_nums_info').html('' + elevator_nums)
    $('#floor_nums_info').html('' + floor_nums)
    $(".g-container").html(grids_html_of_a_building(floor_nums, elevator_nums))
    set_g_container_grid_template(floor_nums, elevator_nums)
    choose_outdoor_witches(1, DIRECTION_DOWN).hide()
    choose_outdoor_witches(floor_nums, DIRECTION_UP).hide()
    cal_floor_height()
    cal_elevator_main_first_top()
    $('.elevator-line').height(cal_elevator_line_height(floor_nums) + 'px')
}


function set_g_container_grid_template(floor_nums, elevator_nums) {
    let column_res = wall_side_with + string_repeat(' ' + wall_main_with, elevator_nums) + ' ' + wall_side_with
    let row_res = top_floor_height + string_repeat(' ' + celling_height + ' ' + wall_main_height + ' ' + ground_height, floor_nums)
    $('.g-container').css('grid-template-columns', column_res)
    $('.g-container').css('grid-template-rows', row_res)

}


function ext_set_is_AI_mode_enabled(enable_AI_mode) {
    if (enable_AI_mode) {
        $('.enable-AI-mode-button').html('关闭智能模式')
    } else {

        $('.enable-AI-mode-button').html('启动智能模式')
    }
}

function toggle_outdoor_switch(floor_no, direct) {
    let rev_state = ON
    if (outdoor_buttons_state[floor_no][direct] === ON) {
        rev_state = OFF
    }
    set_outdoor_switch(floor_no, direct, rev_state)
}

function set_outdoor_switch(floor_no, direct, state) {
    outdoor_buttons_state[floor_no][direct] = state
    if (outdoor_buttons_state[floor_no][direct] === ON) {
        choose_outdoor_witches(floor_no, direct).css('background', 'orange')
        dispatch_request(floor_no, direct)
    } else {
        choose_outdoor_witches(floor_no, direct).css('background', 'white')
    }
}

function set_indoor_floor_switch_state(floor_no, elevator_no, state) {
    if (state === ON) {

        ext_choose_indoor_foor_switch(floor_no, elevator_no).css({'background': 'orange'})
    } else {
        ext_choose_indoor_foor_switch(floor_no, elevator_no).css({'background': 'white'})
    }
}

function choose_outdoor_witches(floor_no, direct) {
    if (direct === DIRECTION_UP) {
        return $('.elevator-window.' + floor_no + ' .choose-up')
    } else {
        return $('.elevator-window.' + floor_no + ' .choose-down')
    }
}

function ext_choose_indoor_foor_switch(floor_no, elevator_no) {
    return $('.choose-floor-block.' + elevator_no + ' .choose-floor-button.' + floor_no)
}

function ext_choose_indoor_open_door_switch(elevator_no) {
    return $('.choose-floor-block.' + elevator_no + ' .indoor-open-door')
}

function ext_choose_indoor_close_door_switch(elevator_no) {
    return $('.choose-floor-block.' + elevator_no + ' .indoor-close-door')
}

function ext_choose_indoor_floor_number_display(elevator_no) {
    return $('.floor-number.' + elevator_no)
}

function ext_choose_indoor_direction_display(elevator_no) {
    return $('.elevator-direction.' + elevator_no)
}

function set_indoor_floor_number_display(floor_no, elevator_no) {
    ext_choose_indoor_floor_number_display(elevator_no).html('' + floor_no)
}


let direction_display_symbol = new Map([
    [DIRECTION_UP, '￪'],
    [DIRECTION_DOWN, '￬'],
    [DIRECTION_STILL, ''],
    [DIRECTION_AI_MODE_WAITING_FOR_CHANGING, 'C']
])

function set_indoor_direction_display(elevator_no, direct) {
    let res = ''
    if (enable_AI_mode_display && elevators[elevator_no].state.now_direction === DIRECTION_STILL && elevators[elevator_no].state.auto_mode_state === AI_MODE_RUNNING) {
        res = 'A'
    } else if (direct === DIRECTION_AI_MODE_WAITING_FOR_CHANGING && (!enable_AI_mode_display || !enable_DIRECTION_AI_MODE_WAITING_FOR_CHANGING_display)) {
        res = ''
    } else {
        res = direction_display_symbol.get(direct)
    }
    ext_choose_indoor_direction_display(elevator_no).html(res)
}


let tempalte_of_choose_floor_button = '<button class="btn btn-default btn-circle  choose-floor-button mark-of-fno" type="button">mark-of-fno</button>\n' +
    '                    '
let template_of_open_close_buttons = '' +
    '            <div class="open-close-buttons">\n' +
    '                <button class="btn btn-default btn-circle open-close indoor-open-door choose-floor-button" type="button">◀|▶\n' +
    '                </button>\n' +
    '                <button class="btn btn-default btn-circle open-close indoor-close-door choose-floor-button" type="button">▶|◀\n' +
    '                </button>\n' +
    '\n' +
    '            </div>'

function div_html_of_open_close_buttons() {
    return template_of_open_close_buttons
}

function div_html_of_choose_floor_block(floor_nums, elevator_no) {
    let res = ('<div class="g-panel-item-wrapper"><div class="elevator-window choose-floor-block mark-of-eno">\n' +
        '<div class="take-place elevator-info">\n' +
        '                        <p class="choose-floor-prompt"><span class="a">#mark-of-eno</span></p>\n' +
        '\n' +
        '     <div class="now-floor-info">\n' +
        '                        <div class="floor-info-decoration"></div>\n' +
        '                        <div class="elevator-direction mark-of-eno">￬</div><div class="floor-number mark-of-eno">1</div></div>\n' +
        '\n' +
        '                    </div>').replace(/mark-of-eno/g, elevator_no)
    for (let k = 1; k <= floor_nums; k++) {
        res += tempalte_of_choose_floor_button.replace(/mark-of-fno/g, k)
    }

    res += div_html_of_open_close_buttons()
    res += '</div></div>'
    return res
}

let template_of_choose_floor_block_side = '<div class="g-panel-item-wrapper"><div class="elevator-window choose-floor-block panel-side"></div></div>'

function div_html_off_choose_floor_block_side() {
    return template_of_choose_floor_block_side
}


function set_panel_body(floor_nums, elevator_nums) {
    let res = div_html_off_choose_floor_block_side()
    for (let k = 1; k <= elevator_nums; k++) {
        res += div_html_of_choose_floor_block(floor_nums, k)
    }
    res += div_html_off_choose_floor_block_side()
    $('#g-panel-body').html(res)
    let grid_template_columns_of_panel_body =
        wall_side_with + string_repeat(' ' + wall_main_with, elevator_nums) + ' ' + wall_side_with
    $('#g-panel-body').css('grid-template-columns', grid_template_columns_of_panel_body)
    $('.take-place-panel').css({'height': $('#g-panel-content').height()})

    for (let i = 1; i <= elevator_nums; i++) {
        elevators[i].set_now_floor_no(elevators[i].state.now_floor_no)
        elevators[i].set_now_direction(elevators[i].state.now_direction)
    }
    pin_element_to_bottom('g-panel-content')
}


//building

let template_of_td_ceiling = '<div class="elevator-window ceiling"></div>'

function divs_html_of_a_ceiling(floor_no, elevator_nums) {
    return string_repeat(template_of_td_ceiling, elevator_nums + 2)
}


let template_of_div_elevator_window = '<div class="elevator-window mark-of-fno mark-of-fno-mark-of-eno">\n' +
    '                        <button class="btn btn-default btn-circle  elevator-choose-take choose-up" type="button">▲\n' +
    '                        </button>\n' +
    '                        <button class="btn btn-default btn-circle  elevator-choose-take choose-down" type="button">▼\n' +
    '                        </button>\n' +
    '\n' +
    '                        mark-of-elevator-main\n' +
    '                        <div class="elevator-body elevator-outdoor ">\n' +
    '                            <div class="elevator-door door-left"></div>\n' +
    '                            <div class="elevator-door door-right"></div>\n' +
    '                        </div>\n' +
    '                    </div>'
let template_of_div_elevator_main = '                        <div class="elevator-body elevator-main mark-of-eno">\n' +
    '\n' +
    '                            <div class="elevator-line"></div>\n' +
    '                        </div>'

function div_html_of_elevator_window(floor_no, elevator_no) {
    let elevator_main_info = ''
    if (floor_no === 1) {
        elevator_main_info = template_of_div_elevator_main.replace(/mark-of-eno/g, elevator_no)
    }
    return template_of_div_elevator_window.replace(/mark-of-fno/g, floor_no).replace(/mark-of-eno/g, elevator_no).replace(/mark-of-elevator-main/g, elevator_main_info)
}

let path_of_potting = "images/potting-2.png"
let template_of_td_elevator_wall_side = '        ' +
    '<div class="elevator-window ">\n' +
    '            <div class="floor-symbol">\n' +
    '                mark_floor_no\n' +
    '            </div>\n' +
    '\n' +
    '            <img class="potting" src="mark-of-potting-path">\n' +
    '\n' +
    '</div>'

function div_html_of_elevator_wall_side(floor_no) {
    return template_of_td_elevator_wall_side.replace(/mark_floor_no/g, floor_no).replace(/mark-of-potting-path/g, path_of_potting)
}

function divs_html_of_elevator_wall(floor_no, elevator_nums) {
    let res = ''
    res += div_html_of_elevator_wall_side('F' + floor_no)
    for (let i = 1; i <= elevator_nums; i++) {
        res += div_html_of_elevator_window(floor_no, i)
    }
    res += div_html_of_elevator_wall_side('')
    return res
}

let template_of_td_elevator_ground = '<div class="elevator-window ceiling ground">\n' +
    '\n' +
    '                        <div class="blanket"></div>\n' +
    '\n' +
    '                    </div>'

function divs_html_of_a_ground(floor_no, elevator_nums) {
    return string_repeat(template_of_td_elevator_ground, elevator_nums + 2)
}

function divs_html_of_a_floor(floor_no, elevator_nums) {
    return divs_html_of_a_ceiling(floor_no, elevator_nums) + divs_html_of_elevator_wall(floor_no, elevator_nums) +
        divs_html_of_a_ground(floor_no, elevator_nums)
}

let template_of_building_banner = '<div class="banner-item">mark_of_building_name</div>'
let template_of_div_top_floor = '<div class="elevator-window elevator-ceiling"></div>'

function divs_html_of_top_floor(floor_no, elevator_nums) {
    let res = ''
    res += template_of_building_banner.replace(/mark_of_building_name/g, building_name)
    res += string_repeat(template_of_div_top_floor, elevator_nums + 2)
    return res
}

function grids_html_of_a_building(floor_nums, elevator_nums) {
    let res = divs_html_of_top_floor(floor_nums + 1, elevator_nums)
    for (let i = floor_nums; i >= 1; i--) {
        res += divs_html_of_a_floor(i, elevator_nums)
    }
    return res
}


let elevator_line_height = 330
let elevator_main_first_top = 123
let floor_height = 320

function cal_elevator_main_first_top() {
    elevator_main_first_top = $(".elevator-main.1").position().top
    return elevator_main_first_top
}

// let elevator_line_first_height
function cal_elevator_line_height(floor_nums) {
    elevator_line_height = cal_floor_height() * floor_nums - $(".elevator-main").height() -
        $('.elevator-window.ceiling.ground').height()
    return elevator_line_height
}

function cal_floor_height() {
    floor_height = $(".elevator-window.1-1").height() +
        $('.elevator-window.ceiling').height() +
        $('.elevator-window.ceiling.ground').height()
    return floor_height
}

function controller_directly_go_to_floor(elevator_no, floor_no) {
    $('.elevator-main.' + elevator_no).css({'top': elevator_main_first_top - (floor_no - 1) * floor_height + 'px'})
    $('.elevator-main.' + elevator_no + ' .elevator-line').css({'height': elevator_line_height - (floor_no - 1) * floor_height + 'px'})

}

function controller_wait_for_timeout_and_callBack(elevator_no, waiting_duration, callBack) {
    $('.elevator-main.' + elevator_no).animate({opacity: '-=%0'}, waiting_duration, "linear", callBack)
}

function controller_stop_waiting_for_timeout_and_callback(elevator_no, callBack) {
    $('.elevator-main.' + elevator_no).stop()
    callBack()
}

function controller_move_up(elevator_no, callBack) {
    $('.elevator-main.' + elevator_no + ' .elevator-line').animate({height: '-=' + floor_height + 'px'}, floor_height * moving_speed_millisecond_per_pixel, "linear")

    $('.elevator-main.' + elevator_no).animate({top: '-=' + floor_height + 'px'}, floor_height * moving_speed_millisecond_per_pixel, "linear", callBack)
}

function controller_move_down(elevator_no, callBack) {

    $('.elevator-main.' + elevator_no + ' .elevator-line').animate({height: '+=' + floor_height + 'px'}, floor_height * moving_speed_millisecond_per_pixel, "linear")
    $('.elevator-main.' + elevator_no).animate({top: '+=' + floor_height + 'px'}, floor_height * moving_speed_millisecond_per_pixel, "linear", callBack)


}


function controller_close_door(floor_no, elevator_no, callBack) {
    let elevator_window_mark = floor_no + '-' + elevator_no
    $('.elevator-main.' + elevator_no).animate({opacity: '75%'}, toggle_door_secs, "linear", callBack)
    $('.elevator-window.' + elevator_window_mark + ' .elevator-door').animate({width: '50%'}, toggle_door_secs, "linear")
}

function controller_stop_closing_door(floor_no, elevator_no, callBack) {
    let elevator_window_mark = floor_no + '-' + elevator_no
    $('.elevator-main.' + elevator_no).stop()
    $('.elevator-window.' + elevator_window_mark + ' .elevator-door').stop()
    callBack()
}

function controller_open_door(floor_no, elevator_no, callBack) {
    let elevator_window_mark = floor_no + '-' + elevator_no
    $('.elevator-main.' + elevator_no).animate({opacity: '100%'}, toggle_door_secs, "linear", callBack)
    $('.elevator-window.' + elevator_window_mark + ' .elevator-door').animate({width: '0%'}, toggle_door_secs, "linear")
}


function display_set_floor_nums_dialog() {
    swal(
        {
            title: '请设置楼层数量',
            text: '楼层数量为2-50(包含)之间的数字\n\n注意：如果您使用了浏览器缩放功能，请调回100%再设置以正常使用！',
            type: 'input',
            showCancelButton: true,
            closeOnConfirm: false,
            animation: 'slide-from-top',
            inputPlaceholder: '在此输入您期望的楼层数量...'
        },
        function (inputValue) {
            if (inputValue === false) {
                return false;
            }
            if (inputValue === '') {
                swal.showInputError('内容不能为空！');
                return false;
            }
            var re = /^\+?[1-9][0-9]*$/s;
            if (!re.test(inputValue)) {
                swal.showInputError('请输入合法的正整数！');
                return false;
            }
            let value = parseInt(inputValue)
            console.log(value)
            if (value < 2 || value > 50) {
                swal.showInputError(
                    '楼层数目必须在2-50区间，您输入的值为' + value +
                    '!')
                return false;
            }
            set_building_configs_and_rebuild(value, elevator_nums)
            swal(
                'Nice!',
                '您的楼层数目已更改为：' + value + '，新的电梯系统已生成！',
                'success',
            )
        });
}

function display_set_elevator_nums_dialog() {
    swal(
        {
            title: '请设置电梯数量',
            text: '电梯数量为1-30(包含)之间的数字\n\n注意：如果您使用了浏览器缩放功能，请调回100%再设置以正常使用！',
            type: 'input',
            showCancelButton: true,
            closeOnConfirm: false,
            animation: 'slide-from-top',
            inputPlaceholder: '在此输入您期望的电梯数量...'
        },
        function (inputValue) {
            if (inputValue === false) {
                return false;
            }
            if (inputValue === '') {
                swal.showInputError('内容不能为空！');
                return false;
            }
            var re = /^\+?[1-9][0-9]*$/;
            if (!re.test(inputValue)) {
                swal.showInputError('请输入合法的正整数！');
                return false;
            }
            let value = parseInt(inputValue)
            console.log(value)
            if (value < 1 || value > 30) {
                swal.showInputError(
                    '电梯数目必须在1-30区间，您输入的值为' + value +
                    '!')
                return false;
            }
            set_building_configs_and_rebuild(floor_nums, value)
            swal(
                'Nice!',
                '您的楼电梯数量已更改为：' + value + '，新的电梯系统已生成！',
                'success',
            )
        });
}
