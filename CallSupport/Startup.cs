﻿using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Globalization;
using Microsoft.Data.SqlClient;
using System.IO;
using Newtonsoft.Json.Linq;
using CallSupport.Hubs;
using Microsoft.AspNetCore.Http.Features;

namespace CallSupport
{
    public class Startup
    {
        public IConfiguration Configuration { get; }
        public static string ConnectionString { get; private set; }
        private const int MaxRetries = 3;
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
            ConnectionString = GetConnectionStringWithFallback("FallbackConnection");
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllersWithViews().AddRazorRuntimeCompilation(); ;
            services.AddSingleton<ConnectionMapping>();
            services.AddSignalR();
            services.AddSingleton<SqlDependencyService>();
            //Session
            services.AddSession(cfg =>
            {
                cfg.IdleTimeout = TimeSpan.FromHours(8);
                cfg.Cookie.Name = ".Linecode-support.Session"; // <--- Add line
                cfg.Cookie.HttpOnly = true;
                cfg.Cookie.IsEssential = true;
            });

            //Config CORS
            services.AddCors(o => o.AddPolicy("LinecodeSupport", builder =>
            {
                builder.AllowAnyOrigin()
                       .AllowAnyMethod()
                       .AllowAnyHeader();
            }));

            services.Configure<RequestLocalizationOptions>(options =>
            {
                options.SupportedCultures = new List<CultureInfo> { new CultureInfo("vi-VN") };
            });
            services.Configure<FormOptions>(options => {
                options.MultipartBodyLengthLimit = 10485760; // 10 MB limit
            });
            services.AddDirectoryBrowser();
        }
        private string GetConnectionStringWithFallback(string fallbackKey)
        {
            string connectionString = null;
            int attempts = 0;

            while (attempts < MaxRetries)
            {
                try
                {
                    connectionString = ReadConnectionStringFromExternalFile("websettings.json", "DefaultConnection");
                    if (TestDatabaseConnection(connectionString))
                    {
                        return connectionString;
                    }
                    else
                    {
                        throw new Exception($"Kết nối tới '{connectionString}' thất bại");
                    }
                }
                catch (Exception ex)
                {
                    string logFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "log.txt");
                    string logMessage = $"[{DateTime.Now}] Error: {ex.Message}\n{ex.StackTrace}\n\n";

                    File.AppendAllText(logFilePath, logMessage);
                }

                attempts++;
            }

            // Fallback to appsettings.json
            connectionString = Configuration.GetConnectionString(fallbackKey);
            return connectionString;
        }

        private string ReadConnectionStringFromExternalFile(string filePath, string key)
        {
            if (File.Exists(filePath))
            {
                var json = File.ReadAllText(filePath);
                var config = JObject.Parse(json);
                var connectionString = config["ConnectionStrings"]?[key]?.ToString();
                if (!string.IsNullOrEmpty(connectionString))
                {
                    return connectionString;
                }
            }

            throw new Exception("Failed to read connection string from external file.");
        }

        private bool TestDatabaseConnection(string connectionString)
        {
            try
            {
                using (var connection = new SqlConnection(connectionString))
                {
                    connection.Open();
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }


        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }
            app.UseSession();
            app.UseCors("LinecodeSupport");
            app.UseHttpsRedirection();
            app.UseStaticFiles();
            //app.UseStaticFiles(new StaticFileOptions // uncomment this if you need clients to refetch static files
            //{
            //    OnPrepareResponse = context => {
            //        context.Context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            //        context.Context.Response.Headers["Pragma"] = "no-cache";
            //        context.Context.Response.Headers["Expires"] = "0";
            //    }
            //});
            app.UseMiddleware<ExceptionHandlingMiddleware>();
            app.UseRouting();

            app.UseAuthentication();

            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapControllerRoute(
                   name: "default",
                   pattern: "{controller=Home}/{action=Index}/");
                endpoints.MapHub<NotificationHub>("/notificationHub");
            });
            app.ApplicationServices.GetService<SqlDependencyService>();
            //app.UseStatusCodePagesWithRedirects("/Home/Error");
        }
    }
}
