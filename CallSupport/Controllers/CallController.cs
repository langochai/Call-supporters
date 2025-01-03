﻿using CallSupport.Common;
using CallSupport.Models;
using CallSupport.Models.DTO;
using CallSupport.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections;
using System.Linq;

namespace CallSupport.Controllers
{
    public class CallController : Controller
    {
        public IActionResult Index()
        {
            var user = HttpContext.Session.GetObject<AuthInfoDTO>("User");
            if (user.UserName == null) return RedirectToAction("Index", "Login", null);
            return View();
        }

        [HttpPost]
        [Route("/Call")]
        public IActionResult Insert(HistoryMst data, CallImagesDTO extra)
        {
            var userInfo = HttpContext.Session.GetObject<AuthInfoDTO>("User");
            if (!userInfo.IsCaller) return StatusCode(403, "Bạn không có quyền truy cập");
            var currentTime = SQLUtilities.GetDate();
            var historyRepo = new HistoryRepo();
            var existingCalls = historyRepo.Find(h =>
                (h.StatusCalling == "0" || h.StatusCalling == "1") && h.LineC == data.LineC &&
                h.SecC == data.SecC && h.ToDepC == data.ToDepC && EF.Functions.DateDiffHour(h.CallingTime, currentTime) <= 12
            );
            if (existingCalls.Count > 0) return StatusCode(409, $"Dây chuyền {data.LineC} công đoạn {data.SecC} vẫn đang gọi");
            try
            {
                var insertData = new HistoryMst
                {
                    CallingTime = currentTime,
                    CallerC = data.CallerC,
                    DepC = data.DepC,
                    StatusCalling = "0", // why the hell is this a string? the guy who made this DB had problems
                    LineC = data.LineC,
                    SecC = data.SecC,
                    PosC = data.PosC,
                    UptDt = currentTime,
                    ToDepC = data.ToDepC,
                    ErrC = data.ErrC,
                    StatusLine = data.StatusLine,
                    Ipaddress = userInfo.Ipaddress,
                    ComputerName = Environment.MachineName
                };
                var historyIMGRepo = new HistoryIMGRepo();
                var newHistoryIMG = new HistoryImg
                {
                    CallingTime = insertData.CallingTime,
                    LineC = insertData.LineC,
                    SecC = insertData.SecC,
                    PosC = insertData.PosC,
                    Tools = String.Join(',', extra.Tools ?? Enumerable.Empty<int>()),
                    DefectNote = extra.Note,
                    DefectImg = String.Join(',', extra.Images ?? Enumerable.Empty<int>()),
                };
                historyIMGRepo.Create(newHistoryIMG);
                historyRepo.Create(insertData);
                return Ok(insertData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}