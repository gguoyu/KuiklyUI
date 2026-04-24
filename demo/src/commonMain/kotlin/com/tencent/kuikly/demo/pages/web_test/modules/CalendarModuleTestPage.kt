package com.tencent.kuikly.demo.pages.web_test.modules

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.module.CalendarModule
import com.tencent.kuikly.core.module.ICalendar
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.compose.Button

@Page("CalendarModuleTestPage")
internal class CalendarModuleTestPage : Pager() {
    private val sampleTimestamp = 1727742600100L
    private val formatPattern = "yyyy-MM-dd HH:mm:ss.SSS"
    private var calendarResult by observable("calendar:pending")
    private var timestampResult by observable("timestamp:pending")
    private var addResult by observable("added:pending")
    private var formatResult by observable("formatted:pending")
    private var quotedFormatResult by observable("quoted:pending")

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            List {
                attr {
                    flex(1f)
                    backgroundColor(Color.WHITE)
                }
                Text { attr { text("CalendarModuleTestPage"); color(Color.BLACK); marginTop(20f); marginLeft(16f) } }
                Button {
                    attr { titleAttr { text("timestampToCalendar") }; size(width = 220f, height = 48f); margin(left = 16f, top = 16f); backgroundColor(0xFF1E88E5) }
                    event {
                        click {
                            val calendar = ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME).newCalendarInstance(ctx.sampleTimestamp)
                            ctx.calendarResult = "calendar:${calendar.get(ICalendar.Field.YEAR)}-${calendar.get(ICalendar.Field.MONTH) + 1}-${calendar.get(ICalendar.Field.DAY_OF_MONTH)}"
                        }
                    }
                }
                Text { attr { text(ctx.calendarResult); margin(left = 16f, top = 8f) } }
                Button {
                    attr { titleAttr { text("calendarToTimestamp") }; size(width = 220f, height = 48f); margin(left = 16f, top = 16f); backgroundColor(0xFF43A047) }
                    event {
                        click {
                            val calendar = ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME).newCalendarInstance(0)
                            calendar.set(ICalendar.Field.YEAR, 2024)
                            calendar.set(ICalendar.Field.MONTH, 9)
                            calendar.set(ICalendar.Field.DAY_OF_MONTH, 1)
                            calendar.set(ICalendar.Field.HOUR_OF_DAY, 8)
                            calendar.set(ICalendar.Field.MINUS, 30)
                            calendar.set(ICalendar.Field.SECOND, 0)
                            calendar.set(ICalendar.Field.MILLISECOND, 100)
                            ctx.timestampResult = "timestamp:${calendar.timeInMillis()}"
                        }
                    }
                }
                Text { attr { text(ctx.timestampResult); margin(left = 16f, top = 8f) } }
                Button {
                    attr { titleAttr { text("addCalendar") }; size(width = 220f, height = 48f); margin(left = 16f, top = 16f); backgroundColor(0xFFF4511E) }
                    event {
                        click {
                            val calendar = ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME).newCalendarInstance(ctx.sampleTimestamp)
                            calendar.add(ICalendar.Field.MONTH, 3)
                            calendar.add(ICalendar.Field.MINUS, 35)
                            ctx.addResult = "added:${calendar.get(ICalendar.Field.YEAR)}-${calendar.get(ICalendar.Field.MONTH) + 1}-${calendar.get(ICalendar.Field.DAY_OF_MONTH)}"
                        }
                    }
                }
                Text { attr { text(ctx.addResult); margin(left = 16f, top = 8f) } }
                Button {
                    attr { titleAttr { text("formatTimestamp") }; size(width = 220f, height = 48f); margin(left = 16f, top = 16f); backgroundColor(0xFF8E24AA) }
                    event {
                        click {
                            ctx.formatResult = "formatted:${ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME).formatTime(ctx.sampleTimestamp, ctx.formatPattern)}"
                        }
                    }
                }
                Text { attr { text(ctx.formatResult); margin(left = 16f, top = 8f) } }
                Button {
                    attr { titleAttr { text("formatWithQuotes") }; size(width = 220f, height = 48f); margin(left = 16f, top = 16f); backgroundColor(0xFF00897B) }
                    event {
                        click {
                            // format with single-quoted literal text — triggers getReplaceReadyFormatString
                            val quotedPattern = "yyyy'年'MM'月'dd'日'"
                            ctx.quotedFormatResult = "quoted:${ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME).formatTime(ctx.sampleTimestamp, quotedPattern)}"
                        }
                    }
                }
                Text { attr { text(ctx.quotedFormatResult); margin(left = 16f, top = 8f) } }
            }
        }
    }
}
