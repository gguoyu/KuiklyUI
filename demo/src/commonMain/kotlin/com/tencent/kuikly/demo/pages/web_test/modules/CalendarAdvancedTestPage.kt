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

/**
 * Calendar advanced operations test page
 *
 * Covers KRCalendarModule branches:
 * - DAY_OF_YEAR add/set operations
 * - MILLISECOND add/set operations
 * - getTimeInMillis with operations
 * - parseFormat with error handling
 * - format with escaped single quotes
 */
@Page("CalendarAdvancedTestPage")
internal class CalendarAdvancedTestPage : Pager() {
    private val sampleTimestamp = 1727742600100L
    private var dayOfYearResult by observable("doy:pending")
    private var millisResult by observable("ms:pending")
    private var timeInMillisResult by observable("tim:pending")
    private var parseErrorResult by observable("parseErr:pending")
    private var quoteFormatResult by observable("quote:pending")
    private var parseFullResult by observable("parseFull:pending")
    private var timeOnlyResult by observable("timeOnly:pending")
    private var unclosedQuoteResult by observable("unclosed:pending")

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            List {
                attr {
                    flex(1f)
                    backgroundColor(Color.WHITE)
                }

                Text {
                    attr {
                        text("Calendar Advanced")
                        color(Color.BLACK)
                        marginTop(20f)
                        marginLeft(16f)
                        fontSize(16f)
                        fontWeightBold()
                    }
                }

                // DAY_OF_YEAR operations
                Button {
                    attr {
                        titleAttr { text("DAY_OF_YEAR add/set") }
                        size(width = 240f, height = 48f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFF1E88E5)
                    }
                    event {
                        click {
                            val m = ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME)
                            val cal = m.newCalendarInstance(ctx.sampleTimestamp)
                            val doy1 = cal.get(ICalendar.Field.DAY_OF_YEAR)
                            cal.add(ICalendar.Field.DAY_OF_YEAR, 5)
                            val doy2 = cal.get(ICalendar.Field.DAY_OF_YEAR)
                            cal.set(ICalendar.Field.DAY_OF_YEAR, 100)
                            val doy3 = cal.get(ICalendar.Field.DAY_OF_YEAR)
                            ctx.dayOfYearResult = "doy:$doy1,$doy2,$doy3"
                        }
                    }
                }
                Text { attr { text(ctx.dayOfYearResult); margin(left = 16f, top = 8f) } }

                // MILLISECOND operations
                Button {
                    attr {
                        titleAttr { text("MILLISECOND add/set") }
                        size(width = 240f, height = 48f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFF43A047)
                    }
                    event {
                        click {
                            val m = ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME)
                            val cal = m.newCalendarInstance(ctx.sampleTimestamp)
                            val ms1 = cal.get(ICalendar.Field.MILLISECOND)
                            cal.add(ICalendar.Field.MILLISECOND, 500)
                            val ms2 = cal.get(ICalendar.Field.MILLISECOND)
                            cal.set(ICalendar.Field.MILLISECOND, 0)
                            val ms3 = cal.get(ICalendar.Field.MILLISECOND)
                            ctx.millisResult = "ms:$ms1,$ms2,$ms3"
                        }
                    }
                }
                Text { attr { text(ctx.millisResult); margin(left = 16f, top = 8f) } }

                // getTimeInMillis with operations
                Button {
                    attr {
                        titleAttr { text("getTimeInMillis ops") }
                        size(width = 240f, height = 48f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFFF4511E)
                    }
                    event {
                        click {
                            val m = ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME)
                            val cal = m.newCalendarInstance(ctx.sampleTimestamp)
                            cal.add(ICalendar.Field.HOUR_OF_DAY, 2)
                            cal.set(ICalendar.Field.MINUS, 0)
                            val tim = cal.timeInMillis()
                            ctx.timeInMillisResult = "tim:$tim"
                        }
                    }
                }
                Text { attr { text(ctx.timeInMillisResult); margin(left = 16f, top = 8f) } }

                // parseFormat error handling
                Button {
                    attr {
                        titleAttr { text("parseFormat error") }
                        size(width = 240f, height = 48f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFFE53935)
                    }
                    event {
                        click {
                            val m = ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME)
                            // Pass mismatched format to trigger error branch
                            val result = try {
                                m.parseFormattedTime("not-a-date", "yyyy-MM-dd")
                            } catch (e: Throwable) {
                                "error"
                            }
                            ctx.parseErrorResult = "parseErr:$result"
                        }
                    }
                }
                Text { attr { text(ctx.parseErrorResult); margin(left = 16f, top = 8f) } }

                // Format with escaped single quotes
                Button {
                    attr {
                        titleAttr { text("format quotes") }
                        size(width = 240f, height = 48f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFF8E24AA)
                    }
                    event {
                        click {
                            val m = ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME)
                            // Single quotes with escaped quotes inside
                            val pattern1 = "yyyy-MM-dd 'at' HH:mm"
                            val pattern2 = "yyyy-MM-dd ''test''"
                            val r1 = m.formatTime(ctx.sampleTimestamp, pattern1)
                            val r2 = m.formatTime(ctx.sampleTimestamp, pattern2)
                            ctx.quoteFormatResult = "q:$r1|$r2"
                        }
                    }
                }
                Text { attr { text(ctx.quoteFormatResult); margin(left = 16f, top = 8f) } }

                // parseFormattedTime with full format (HH:mm:ss.SSS) to cover hour/minute/second/millisecond branches
                Button {
                    attr {
                        titleAttr { text("parseFull format") }
                        size(width = 240f, height = 48f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFF00897B)
                    }
                    event {
                        click {
                            val m = ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME)
                            val result = try {
                                m.parseFormattedTime("2024-10-01 08:30:15.100", "yyyy-MM-dd HH:mm:ss.SSS")
                            } catch (e: Throwable) {
                                -1L
                            }
                            ctx.parseFullResult = "parseFull:$result"
                        }
                    }
                }
                Text { attr { text(ctx.parseFullResult); margin(left = 16f, top = 8f) } }

                // time-only format (no year/month/day) — exercises yearStart==-1 branch
                Button {
                    attr {
                        titleAttr { text("time-only format") }
                        size(width = 240f, height = 48f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFFFF6F00)
                    }
                    event {
                        click {
                            val m = ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME)
                            val result = try {
                                m.formatTime(ctx.sampleTimestamp, "HH:mm:ss")
                            } catch (e: Throwable) {
                                "error:${e.message}"
                            }
                            ctx.timeOnlyResult = "timeOnly:$result"
                        }
                    }
                }
                Text { attr { text(ctx.timeOnlyResult); margin(left = 16f, top = 8f) } }

                // unclosed quote format — exercises inLiteral after-loop branch
                Button {
                    attr {
                        titleAttr { text("unclosed quote") }
                        size(width = 240f, height = 48f)
                        margin(left = 16f, top = 16f)
                        backgroundColor(0xFFD84315)
                    }
                    event {
                        click {
                            val m = ctx.acquireModule<CalendarModule>(CalendarModule.MODULE_NAME)
                            val result = try {
                                m.formatTime(ctx.sampleTimestamp, "yyyy-MM-dd'unclosed")
                            } catch (e: Throwable) {
                                "error:${e.message}"
                            }
                            ctx.unclosedQuoteResult = "unclosed:$result"
                        }
                    }
                }
                Text { attr { text(ctx.unclosedQuoteResult); margin(left = 16f, top = 8f) } }
            }
        }
    }
}
