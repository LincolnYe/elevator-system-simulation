function set_indoor_switch_bind(floor_nums, elevator_nums) {
    for (let eno = 1; eno <= elevator_nums; eno++) {
        ext_choose_indoor_close_door_switch(eno).click(
            function () {
                elevators[eno].skip_waiting_for_closing()
            }
        )
        ext_choose_indoor_open_door_switch(eno).click(
            function () {
                elevators[eno].handle_open_door_button_pressed()
            }
        )
        for (let fno = 1; fno <= floor_nums; fno++) {

            ext_choose_indoor_foor_switch(fno, eno).click(
                function () {
                    elevators[eno].toggle_indoor_switch(fno)
                }
            )
        }
    }

}

function set_outdoor_switch_bind(floor_nums, elevator_nums) {
    for (let fno = 1; fno <= floor_nums; fno++) {
        choose_outdoor_witches(fno, DIRECTION_UP).click(
            function () {
                toggle_outdoor_switch(fno, DIRECTION_UP)
            }
        )
        choose_outdoor_witches(fno, DIRECTION_DOWN).click(
            function () {
                toggle_outdoor_switch(fno, DIRECTION_DOWN)
            }
        )
    }
}

function set_system_page_buttons_binding() {
    $('#change-floor-nums').click(display_set_floor_nums_dialog)
    $('#change-elevator_nums').click(display_set_elevator_nums_dialog)
    $('.change_building-button.half-one-half-distribution').click(elevators_position_half_one_half_distribution)
    $('.change_building-button.all-one').click(elevators_position_all_one)
    $('.enable-ai-mode-button').click(toggle_AI_mode)
}

$(function () {
    set_system_page_buttons_binding()
})
