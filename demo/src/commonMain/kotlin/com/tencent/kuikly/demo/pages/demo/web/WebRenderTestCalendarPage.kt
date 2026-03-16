/*
 * Tencent is pleased to support the open source community by making KuiklyUI
 * available.
 * Copyright (C) 2025 Tencent. All rights reserved.
 * Licensed under the License of KuiklyUI;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://github.com/Tencent-TDS/KuiklyUI/blob/main/LICENSE
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.tencent.kuikly.demo.pages.demo.web

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.module.CalendarModule
import com.tencent.kuikly.core.module.ICalendar
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * CalendarModule 全方法测试页面
 * 覆盖：curTimestamp、newCalendarInstance、formatTime、parseFormattedTime、ICalendar.get/set/add
 * 使用固定时间戳确保确定性渲染
 */
@Page("WebRenderTestCalendar")
internal class WebRenderTestCalendarPage : BasePager() {

    // 固定测试时间戳: 2024-01-15 10:30:45.123 (UTC+8)
    private val fixedTimestamp: Long = 1705285845123L

    // 测试结果状态
    private var curTimestampResult by observable("未执行")
    private var calendarFieldsResult by observable("未执行")
    private var formatTimeResult by observable("未执行")
    private var parseTimeResult by observable("未执行")
    private var calendarSetResult by observable("未执行")
    private var calendarAddResult by observable("未执行")
    private var dayOfWeekResult by observable("未执行")
    private var dayOfYearResult by observable("未执行")

    override fun body(): ViewBuilder {
        val ctx = this

        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // 标题
                View {
                    attr {
                        padding(16f)
                        backgroundColor(Color(0xFF1976D2))
                    }
                    Text {
                        attr {
                            text("CalendarModule 测试")
                            fontSize(20f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // 测试1: curTimestamp
                SectionView("1. curTimestamp (当前时间戳)", ctx.curTimestampResult)

                // 测试2: newCalendarInstance + get fields
                SectionView("2. newCalendarInstance + 获取字段", ctx.calendarFieldsResult)

                // 测试3: formatTime
                SectionView("3. formatTime (格式化时间)", ctx.formatTimeResult)

                // 测试4: parseFormattedTime
                SectionView("4. parseFormattedTime (解析时间)", ctx.parseTimeResult)

                // 测试5: calendar.set
                SectionView("5. calendar.set (设置字段)", ctx.calendarSetResult)

                // 测试6: calendar.add
                SectionView("6. calendar.add (增加字段)", ctx.calendarAddResult)

                // 测试7: DAY_OF_WEEK
                SectionView("7. DAY_OF_WEEK (星期)", ctx.dayOfWeekResult)

                // 测试8: DAY_OF_YEAR
                SectionView("8. DAY_OF_YEAR (年中第几天)", ctx.dayOfYearResult)

                // 底部留白
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }

    override fun created() {
        super.created()
        runCalendarTests()
    }

    private fun runCalendarTests() {
        val calendarModule = acquireModule<CalendarModule>(CalendarModule.MODULE_NAME)

        // 测试1: curTimestamp - 获取当前时间戳
        val currentTs = calendarModule.curTimestamp()
        curTimestampResult = "当前时间戳: $currentTs (>0: ${currentTs > 0})"

        // 测试2: newCalendarInstance + 获取各字段
        val calendar = calendarModule.newCalendarInstance(fixedTimestamp)
        val year = calendar.get(ICalendar.Field.YEAR)
        val month = calendar.get(ICalendar.Field.MONTH)
        val day = calendar.get(ICalendar.Field.DAY_OF_MONTH)
        val hour = calendar.get(ICalendar.Field.HOUR_OF_DAY)
        val minute = calendar.get(ICalendar.Field.MINUS)
        val second = calendar.get(ICalendar.Field.SECOND)
        val millis = calendar.get(ICalendar.Field.MILLISECOND)
        calendarFieldsResult = "时间戳:$fixedTimestamp\n" +
                "年:$year 月:${month + 1} 日:$day\n" +
                "时:$hour 分:$minute 秒:$second 毫秒:$millis"

        // 测试3: formatTime - 多种格式
        val format1 = calendarModule.formatTime(fixedTimestamp, "yyyy-MM-dd")
        val format2 = calendarModule.formatTime(fixedTimestamp, "yyyy-MM-dd HH:mm:ss")
        val format3 = calendarModule.formatTime(fixedTimestamp, "MM/dd/yyyy")
        val format4 = calendarModule.formatTime(fixedTimestamp, "HH:mm:ss.SSS")
        formatTimeResult = "格式1: $format1\n" +
                "格式2: $format2\n" +
                "格式3: $format3\n" +
                "格式4: $format4"

        // 测试4: parseFormattedTime
        val parseFormat = "yyyy-MM-dd HH:mm:ss"
        val parseInput = "2024-01-15 10:30:45"
        val parsedTimestamp = calendarModule.parseFormattedTime(parseInput, parseFormat)
        parseTimeResult = "输入: $parseInput\n" +
                "格式: $parseFormat\n" +
                "解析时间戳: $parsedTimestamp"

        // 测试5: calendar.set - 设置各字段
        val calendar2 = calendarModule.newCalendarInstance(0)
        calendar2.set(ICalendar.Field.YEAR, 2025)
        calendar2.set(ICalendar.Field.MONTH, 5)  // 6月 (0-based)
        calendar2.set(ICalendar.Field.DAY_OF_MONTH, 20)
        calendar2.set(ICalendar.Field.HOUR_OF_DAY, 15)
        calendar2.set(ICalendar.Field.MINUS, 30)
        calendar2.set(ICalendar.Field.SECOND, 0)
        val setTimestamp = calendar2.timeInMillis()
        val setYear = calendar2.get(ICalendar.Field.YEAR)
        val setMonth = calendar2.get(ICalendar.Field.MONTH)
        val setDay = calendar2.get(ICalendar.Field.DAY_OF_MONTH)
        calendarSetResult = "设置: 2025-06-20 15:30:00\n" +
                "获取: $setYear-${setMonth + 1}-$setDay\n" +
                "时间戳: $setTimestamp"

        // 测试6: calendar.add - 增加字段
        val calendar3 = calendarModule.newCalendarInstance(fixedTimestamp)
        calendar3.add(ICalendar.Field.MONTH, 3)      // +3个月
        calendar3.add(ICalendar.Field.DAY_OF_MONTH, 10)  // +10天
        calendar3.add(ICalendar.Field.HOUR_OF_DAY, 5)    // +5小时
        val addYear = calendar3.get(ICalendar.Field.YEAR)
        val addMonth = calendar3.get(ICalendar.Field.MONTH)
        val addDay = calendar3.get(ICalendar.Field.DAY_OF_MONTH)
        val addHour = calendar3.get(ICalendar.Field.HOUR_OF_DAY)
        val addTimestamp = calendar3.timeInMillis()
        calendarAddResult = "原始: 2024-01-15 10:30\n" +
                "操作: +3月+10天+5时\n" +
                "结果: $addYear-${addMonth + 1}-$addDay $addHour:30\n" +
                "时间戳: $addTimestamp"

        // 测试7: DAY_OF_WEEK
        val calendar4 = calendarModule.newCalendarInstance(fixedTimestamp)
        val dayOfWeek = calendar4.get(ICalendar.Field.DAY_OF_WEEK)
        val weekNames = arrayOf("", "周日", "周一", "周二", "周三", "周四", "周五", "周六")
        val weekName = if (dayOfWeek in 1..7) weekNames[dayOfWeek] else "未知"
        dayOfWeekResult = "2024-01-15 星期几: $dayOfWeek ($weekName)"

        // 测试8: DAY_OF_YEAR
        val dayOfYear = calendar4.get(ICalendar.Field.DAY_OF_YEAR)
        dayOfYearResult = "2024-01-15 是全年第 $dayOfYear 天"
    }

    private fun ViewBuilder.SectionView(title: String, content: String) {
        View {
            attr {
                margin(12f)
                padding(12f)
                backgroundColor(Color(0xFFF5F5F5))
                borderRadius(8f)
            }
            Text {
                attr {
                    text(title)
                    fontSize(14f)
                    fontWeightBold()
                    color(Color(0xFF333333))
                    marginBottom(8f)
                }
            }
            View {
                attr {
                    padding(8f)
                    backgroundColor(Color.WHITE)
                    borderRadius(4f)
                }
                Text {
                    attr {
                        text(content)
                        fontSize(13f)
                        color(Color(0xFF666666))
                        lineHeight(20f)
                    }
                }
            }
        }
    }
}
