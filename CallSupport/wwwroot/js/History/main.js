﻿$(async () => {
    await loadDepartments();
    await loadLinecodes();
    await loadDateInput();
    await loadHistoryData();
    $('.refresh-history').on('click', loadHistoryData)
    displayPrettier()
})
async function loadLinecodes() {
    const linesData = await getAllLines()
    $('#lines').empty()
    linesData.forEach(l => {
        const option = $(`<option value="${l.LineC}">${l.LineC}-${l.LineNm}</option>`)
        $('#lines').append(option)
    })
    $('#lines').on('change.bs.select', async function () {
        const username = $('#UserName').val()
        const settings = await readRecord(username);
        if (settings) {
            await updateRecord({ ...settings, lines: $('#lines').val() });
        } else {
            await createRecord({
                username: username,
                from_dep: $('#from_department').val(),
                to_dep: $('#to_department').val(),
                lines: $('#lines').val()
            });
        }
    }).bsSelect({
        btnWidth: '',
        btnClass: 'btn-outline-secondary w-100 text-decoration-none',
        btnEmptyText: 'Chọn dây chuyền',
        dropDownListHeight: 300,
        //debug: true,
        showSelectionAsList: true,
    })
    const { lines } = await readRecord($('#UserName').val());
    $('#lines').bsSelect('val', lines)
}
async function loadDepartments() {
    const departments = await getAllDepartments()
    $('#from_department,#to_department').empty()
    $('#from_department,#to_department').append($(`<option value='all'>Tất cả</option>`))
    departments.forEach(d => {
        const option = $(`<option value="${d.DepC}">${d.DepC} - ${d.DepNm}</option>`)
        $('#from_department,#to_department').append(option)
    })
    $('#from_department,#to_department').on('change.bs.select', async function () {
        const username = $('#UserName').val()
        const settings = await readRecord(username);
        if (settings) {
            await updateRecord({
                ...settings,
                from_dep: $('#from_department').val(),
                to_dep: $('#to_department').val(),
            });
        } else {
            await createRecord({
                username: username,
                from_dep: $('#from_department').val(),
                to_dep: $('#to_department').val(),
                lines: $('#lines').val()
            });
        }
    }).bsSelect({
        btnWidth: '',
        btnClass: 'btn-outline-secondary w-100 text-decoration-none',
        btnEmptyText: 'Chọn bộ phận',
        dropDownListHeight: 300,
        //debug: true,
    })
    const { from_dep, to_dep } = await readRecord($('#UserName').val());
    if (from_dep) $('#from_department').bsSelect('val', from_dep)
    if (to_dep) $('#to_department').bsSelect('val', to_dep)
}
function loadDateInput() {
    $('#from_date').each(function () {
        let date = new Date();
        date.setDate(date.getDate() - 1);
        this.valueAsDate = date;
    });
    $('#to_date').each(function () {
        this.valueAsDate = new Date();
    });
    $('input[type="date"]').on('change', function () {
        if (!this.value) this.valueAsDate = new Date();
        loadHistoryData()
    });
}
async function loadHistoryData() {
    try {
        const fromDate = $('#from_date').val()
        const toDate = $('#to_date').val()
        const fromDep = $('#from_department').val()
        const toDep = $('#to_department').val()
        const lines = $('#lines').val()
        iziToast.success({ title: "Loading...", message: "Đang tải dữ liệu", position: 'topRight', displayMode: 'once', timeout: 30000 })
        const data = await getHistory(fromDate, toDate, fromDep, toDep, lines)
        const tbody = $('tbody')
        tbody.empty()
        data.forEach(d => {
            const lineStoppedClass = d.Status_line ? ('line-stop') : '';
            const row = $(`<tr class="${getRowClassName(d.Status_calling)} display-row"></tr>`)
            row.append($(`<td class="text-wrap text-break">${d.Line_c}</td>`))
            row.append($(`<td class="text-wrap text-break">${d.Line_nm}</td>`))
            row.append($(`<td class="text-wrap text-break">${d.Sec_nm}</td>`))
            row.append($(`<td class="text-wrap text-break">${d.Pos_nm}</td>`))
            row.append($(`<td class="text-wrap text-break">${d.ToDep_c}</td>`))
            row.append($(`<td class="text-wrap text-break ${lineStoppedClass}">${d.tenloi}</td>`))
            row.append($(`<td class="text-wrap text-break">${toVNDateTime(d.Calling_time)}</td>`))
            row.data('data', d)
            row.on('click', showCallDetails)
            tbody.append(row)
        })
    }
    catch (err) {
        console.error(err)
        iziToast.error({ title: "Lỗi", message: "Load dữ liệu thất bại", position: 'topRight', displayMode: 'once', timeout: 30000 })
    }
    finally {
        var toast = document.querySelector('.iziToast');
        iziToast.hide({}, toast);
    }
}
/**
 * Use this function to check the data change from notification.js
 * @param {string} actionType It can be 'Insert', 'Update', 'Delete' or 'None'
 * @param {object} inserted Inserted data. Returns empty string if not exist
 * @param {object} deleted Deleted data. Returns empty string if not exist
 */
async function refreshHistory(actionType, inserted, deleted) {
    console.log(actionType, inserted, deleted);
    const tbody = $('tbody')
    if (actionType === 'Insert') {
        if (!isWithinDateRange(inserted.Calling_time)) return;
        const data = await getHistoryDetails(inserted.Calling_time, inserted.Line_c, inserted.Sec_c, inserted.Pos_c)
        if (!data.length) return;
        const lineStoppedClass = data[0].Status_line ? ('line-stop') : '';
        const row = $(`<tr class="${getRowClassName(data[0].Status_calling)} display-row"></tr>`)
        row.append($(`<td class="text-wrap text-break">${data[0].Line_c}</td>`))
        row.append($(`<td class="text-wrap text-break">${data[0].Line_nm}</td>`))
        row.append($(`<td class="text-wrap text-break">${data[0].Sec_nm}</td>`))
        row.append($(`<td class="text-wrap text-break">${data[0].Pos_nm}</td>`))
        row.append($(`<td class="text-wrap text-break">${data[0].ToDep_c}</td>`))
        row.append($(`<td class="text-wrap text-break ${lineStoppedClass}">${data[0].tenloi}</td>`))
        row.append($(`<td class="text-wrap text-break">${toVNDateTime(data[0].Calling_time)}</td>`))
        row.data('data', data[0])
        row.on('click', showCallDetails)
        tbody.prepend(row)
    }
    if (actionType === 'Update') {
        if (!isWithinDateRange(inserted.Calling_time)) return;
        const data = await getHistoryDetails(inserted.Calling_time, inserted.Line_c, inserted.Sec_c, inserted.Pos_c)
        if (!data.length) return;
        const updateRow = tbody.find('tr.display-row').filter((i, r) => {
            const rowData = $(r).data('data')
            return new Date(rowData.Calling_time).getTime() == new Date(inserted.Calling_time).getTime() &&
                rowData.Line_c == inserted.Line_c &&
                rowData.Sec_c == inserted.Sec_c &&
                rowData.Pos_c == inserted.Pos_c
        }).eq(0)
        updateRow.removeClass('waiting repairing finished').addClass(getRowClassName(data[0].Status_calling))
        updateRow.children('td:nth-child(1)').text(`${data[0].Line_c}`);
        updateRow.children('td:nth-child(2)').text(`${data[0].Line_nm}`);
        updateRow.children('td:nth-child(3)').text(`${data[0].Sec_nm}`);
        updateRow.children('td:nth-child(4)').text(`${data[0].Pos_nm}`);
        updateRow.children('td:nth-child(5)').text(`${data[0].ToDep_c}`);
        updateRow.children('td:nth-child(6)').text(`${data[0].tenloi}`)
            .removeClass('line-stop')
            .addClass(data[0].Status_line ? 'line-stop' : '');
        updateRow.children('td:nth-child(7)').text(`${toVNDateTime(data[0].Calling_time)}`);
        updateRow.data('data', data[0])
    }
    if (actionType === 'Delete') {
        if (!isWithinDateRange(deleted.Calling_time)) return;
        const row = tbody.find('tr.display-row').filter((i, r) => {
            const rowData = $(r).data('data');
            return new Date(rowData.Calling_time).getTime() == new Date(deleted.Calling_time).getTime() &&
                rowData.Line_c == deleted.Line_c &&
                rowData.Sec_c == deleted.Sec_c &&
                rowData.Pos_c == deleted.Pos_c
        }).eq(0)
        if (row.hasClass('expand')) row.trigger('click');
        row.remove()
    }
}
function showCallDetails() {
    const $row = $(this)
    const isCaller = $('#is_caller').prop('checked')
    let updateWaitTimeInterval;
    let updateRepairTimeInterval;
    $row.toggleClass('expand')
    if ($row.hasClass('expand')) {
        const data = $row.data('data')
        const callTime = data.Calling_time != null ? toVNDateTime(data.Calling_time) : ''
        const repairTime = data.Repairing_time != null ? toVNDateTime(data.Repairing_time) : ''
        const confirmTime = data.Confirm_time != null ? toVNDateTime(data.Confirm_time) : ''
        const $detailRow = $(`<tr></tr>`)
        const $container = $(`<td class="p-3" colspan="7" style="display:none;background-color: #dee2e6"></td>`)
        const $table = $(
            `<table class="table table-bordered table-call-details">
                <tr>
                    <td><span class="info-header">Mã chuyền</span>: ${data.Line_c}</td>
                    <td><span class="info-header">Tên chuyền</span>: ${data.Line_nm}</td>
                </tr>
                <tr>
                    <td><span class="info-header">Công đoạn</span>: ${data.Sec_nm}</td>
                    <td><span class="info-header">Vị trí</span>: ${data.Pos_nm}</td>
                </tr>
                <tr>
                    <td><span class="info-header">Bộ phận gọi</span>: ${data.Dep_c}</td>
                    <td><span class="info-header">Bộ phận sửa</span>: ${data.ToDep_c}</td>
                </tr>
                <tr>
                    <td colspan="2"><span class="info-header">Loại lỗi</span>: ${data.tenloi}</td>
                </tr>
                <tr>
                    <td colspan="2"><span class="info-header">Người sửa</span>: ${data.Rep_nm ?? ''}</td>
                </tr>
                <tr>
                    <td><span class="info-header">TG Gọi</span>: ${callTime}</td>
                    <td>
                        <span class="info-header">TG chờ sửa chữa</span>:
                        <span class="wait-time" data-value="${data.Calling_time}">${getTimeSpan(data.Calling_time)}</span>
                    </td>
                </tr>
                <tr>
                    <td><span class="info-header">TG Sửa</span>: ${repairTime}</td>
                    <td>
                        <span class="info-header">TG đang sửa chữa</span>:
                        <span class="repair-time" data-value="${data.Repairing_time}">${getTimeSpan(data.Repairing_time)}</span>
                    </td>
                </tr>
                <tr>
                    <td colspan="2"><span class="info-header">TG Xác nhận</span>: ${confirmTime}</td>
                </tr>
            </table>`
        )
        updateWaitTimeInterval = setInterval(() => updateTimeSpan($table.find('.wait-time')), 1000)
        if (data.Rep_nm) updateRepairTimeInterval = setInterval(() => updateTimeSpan($table.find('.repair-time')), 1000)
        const $moveToRepair = $(
            `<a href="/Repair/Details?time=${new Date(data.Calling_time).getTime()}&line=${data.Line_c}&section=${data.Sec_c}&position=${data.Pos_c}"
                    class="btn btn-success btn-repair">
                Sửa chữa
            </a>`
        )
        $moveToRepair.on('click', function (e) {
            const userDepartment = $('#Department').val()
            if (userDepartment != data.ToDep_c) {
                e.preventDefault()
                iziToast.warning({
                    title: 'Thông báo',
                    message: 'Bạn không thuộc bộ phận được gọi',
                    position: 'topRight',
                    displayMode: 'replace'
                })
            }
        })
        $container.append($table)
        if (!isCaller) $container.append($moveToRepair);
        $detailRow.append($container)
        $row.after($detailRow)
        $container.slideDown('fast')
    } else {
        clearInterval(updateWaitTimeInterval)
        clearInterval(updateRepairTimeInterval)
        $row.next().find('td').slideUp('fast', function () {
            $(this).closest('tr').remove()
        })
    }
}
function getRowClassName(statusCalling) {
    if (statusCalling == 0) return "waiting"
    if (statusCalling == 1) return "repairing"
    if (statusCalling == 2) return "finished"
}
function isWithinDateRange(dateString) {
    const date = new Date(dateString);
    const fromDate = new Date($('#from_date').val());
    const toDate = new Date($('#to_date').val());
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    return date >= fromDate && date <= toDate; //remember to use .getTime() if you're not using >= or <=
}
function getTimeSpan(dateString) {
    if (dateString == null) return '';
    let givenDate = new Date(dateString);
    let now = new Date();
    let difference = now - givenDate;
    let hours = Math.floor(difference / (1000 * 60 * 60));
    let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((difference % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
function updateTimeSpan(element) {
    const timeValue = element.attr('data-value')
    const newText = getTimeSpan(timeValue)
    element.text(newText)
}
function displayPrettier() { // for visual only
    $('button.accordion-button').on('click', function () {
        $(this).find('i').toggleClass('fa-spin')
    })
    $('.refresh-history')
        .on('mouseover', function () {
            $(this).find('i').addClass('fa-spin')
        })
        .on('mouseleave', function () {
            $(this).find('i').removeClass('fa-spin')
        })
}