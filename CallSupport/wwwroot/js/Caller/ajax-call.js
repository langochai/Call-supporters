﻿function getPositions(search = '', offset = 0) {
    return new Promise(resolve => {
        $.get({
            url: `/Positions?offset=${+offset}&` + (search ? `search=${search}` : ''),
            success: data => resolve(data),
            error: err => {
                console.error(err)
                iziToast.error({
                    title: 'Lỗi',
                    message: 'Load dữ liệu vị trí thất bại',
                    displayMode: 1,
                    position: 'topRight'
                });
                resolve()
            }
        })
    })
}
function getLines(search = '', offset = 0) {
    return new Promise(resolve => {
        $.get({
            url: `/Lines?offset=${+offset}&` + (search ? `search=${search}` : ''),
            success: data => resolve(data),
            error: err => {
                console.error(err)
                iziToast.error({
                    title: 'Lỗi',
                    message: 'Load dữ liệu dây chuyền thất bại',
                    displayMode: 1,
                    position: 'topRight'
                });
                resolve()
            }
        })
    })
}
function getSections(search = '', offset = 0) {
    return new Promise(resolve => {
        $.get({
            url: `/Sections?offset=${+offset}&` + (search ? `search=${search}` : ''),
            success: data => resolve(data),
            error: err => {
                console.error(err)
                iziToast.error({
                    title: 'Lỗi',
                    message: 'Load dữ liệu công đoạn thất bại',
                    displayMode: 1,
                    position: 'topRight'
                });
                resolve()
            }
        })
    })
}
function getDepartments(search = '', offset = 0) {
    return new Promise(resolve => {
        $.get({
            url: `/Departments?offset=${+offset}&` + (search ? `search=${search}` : ''),
            success: data => resolve(data),
            error: err => {
                console.error(err)
                iziToast.error({
                    title: 'Lỗi',
                    message: 'Load dữ liệu bộ phận thất bại',
                    displayMode: 1,
                    position: 'topRight'
                });
                resolve()
            }
        })
    })
}
function getDefects(search = '', offset = 0) {
    return new Promise(resolve => {
        $.get({
            url: `/Defects?offset=${+offset}&` + (search ? `search=${search}` : ''),
            success: data => resolve(data),
            error: err => {
                console.error(err)
                iziToast.error({
                    title: 'Lỗi',
                    message: 'Load dữ liệu lỗi thất bại',
                    displayMode: 1,
                    position: 'topRight'
                });
                resolve()
            }
        })
    })
}
function getTools(search = '') {
    return new Promise(resolve => {
        $.get({
            url: `/Tools` + (search ? `?search=${search}`:''),
            success: data => resolve(data),
            error: err => {
                console.error(err)
                iziToast.error({
                    title: 'Lỗi',
                    message: 'Load dữ liệu dụng cụ thất bại',
                    displayMode: 1,
                    position: 'topRight'
                });
                resolve()
            }
        })
    })
}
function createCall(data, extra = {}) {
    return new Promise(resolve => {
        $.post({
            url: `/Call`,
            data: {data, extra},
            success: result => resolve(result),
            error: err => {
                console.error(err)
                iziToast.error({
                    title: 'Lỗi',
                    message: err.status == 409 ? err.responseText :'Tạo cuộc gọi thất bại',
                    displayMode: 1,
                    position: 'topRight'
                });
                resolve()
            }
        })
    })
}