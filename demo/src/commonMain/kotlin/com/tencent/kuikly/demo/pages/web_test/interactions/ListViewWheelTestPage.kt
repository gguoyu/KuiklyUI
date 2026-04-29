package com.tencent.kuikly.demo.pages.web_test.interactions

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Refresh
import com.tencent.kuikly.core.views.RefreshView
import com.tencent.kuikly.core.views.RefreshViewState
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.core.views.compose.Button

/**
 * ListView horizontal scroll + wheel + pull-to-refresh completion test page
 *
 * Covers H5ListView branches:
 * - Horizontal scroll direction (flexDirectionRow)
 * - Wheel scroll with start/stop timer
 * - Pull-to-refresh full completion cycle (inset reset)
 */
@Page("ListViewWheelTestPage")
internal class ListViewWheelTestPage : Pager() {
    private var refreshStatus by observable("IDLE")
    private var refreshCompleteCount by observable(0)
    private var horizontalIndex by observable(0)

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE) }

            List {
                attr { flex(1f) }

                Text {
                    attr {
                        text("ListView Wheel & Refresh")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // Section 1: Horizontal ListView
                Text {
                    attr {
                        text("1. Horizontal List")
                        fontSize(14f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                List {
                    attr {
                        height(100f)
                        margin(left = 16f, right = 16f, top = 8f)
                        flexDirectionRow()
                        showScrollerIndicator(true)
                    }
                    for (i in 0 until 15) {
                        View {
                            attr {
                                width(80f)
                                height(80f)
                                margin(left = 8f, top = 10f)
                                backgroundColor(
                                    if (i == ctx.horizontalIndex) Color(0xFF1976D2)
                                    else Color(0xFFBBDEFB)
                                )
                                borderRadius(8f)
                                allCenter()
                            }
                            event {
                                click {
                                    ctx.horizontalIndex = i
                                }
                            }
                            Text {
                                attr {
                                    text("H$i")
                                    fontSize(14f)
                                    color(
                                        if (i == ctx.horizontalIndex) Color.WHITE
                                        else Color.BLACK
                                    )
                                }
                            }
                        }
                    }
                }

                // Section 2: Vertical List with pull-to-refresh
                Text {
                    attr {
                        text("2. Pull Refresh (scroll down)")
                        fontSize(14f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                List {
                    attr {
                        height(300f)
                        margin(left = 16f, right = 16f, top = 8f)
                        showScrollerIndicator(true)
                    }

                    Refresh {
                        attr {
                            height(50f)
                            allCenter()
                        }
                        event {
                            refreshStateDidChange { state ->
                                when (state) {
                                    RefreshViewState.IDLE -> {
                                        ctx.refreshStatus = "IDLE"
                                    }
                                    RefreshViewState.PULLING -> {
                                        ctx.refreshStatus = "PULLING"
                                    }
                                    RefreshViewState.REFRESHING -> {
                                        ctx.refreshStatus = "REFRESHING"
                                        ctx.refreshCompleteCount += 1
                                    }
                                }
                            }
                        }
                        Text {
                            attr {
                                text(ctx.refreshStatus)
                                fontSize(14f)
                                color(0xFF666666)
                            }
                        }
                    }

                    for (i in 0 until 12) {
                        View {
                            attr {
                                height(48f)
                                margin(left = 8f, right = 8f, top = 4f)
                                backgroundColor(
                                    if (i % 2 == 0) Color.WHITE else Color(0xFFF5F5F5)
                                )
                                flexDirectionRow()
                                alignItemsCenter()
                                padding(left = 12f)
                            }
                            Text {
                                attr {
                                    text("Row $i")
                                    fontSize(14f)
                                    color(Color.BLACK)
                                }
                            }
                        }
                    }
                }

                Text {
                    attr {
                        text("refreshCount:${ctx.refreshCompleteCount}")
                        fontSize(12f)
                        marginTop(4f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // Section 3: Wheel scroll list (tall to enable wheel)
                Text {
                    attr {
                        text("3. Wheel Scroll List")
                        fontSize(14f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                List {
                    attr {
                        height(250f)
                        margin(left = 16f, right = 16f, top = 8f)
                        showScrollerIndicator(true)
                    }
                    for (i in 0 until 20) {
                        View {
                            attr {
                                height(40f)
                                margin(left = 8f, right = 8f, top = 2f)
                                backgroundColor(
                                    if (i % 2 == 0) Color(0xFFE3F2FD) else Color(0xFFBBDEFB)
                                )
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("Wheel Item $i")
                                    fontSize(13f)
                                    color(Color.BLACK)
                                }
                            }
                        }
                    }
                }

                View { attr { height(50f) } }
            }
        }
    }
}
