package com.tencent.kuikly.demo.pages.web_test.interactions

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.PageList
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.core.nvi.serialization.json.JSONObject

/**
 * PageList mouse wheel paging test page
 *
 * Covers H5ListPagingHelper branches:
 * - Mouse wheel accumulated delta
 * - Next/previous page switch via wheel
 * - Boundary at first/last page
 * - Horizontal paging direction
 * - Drag threshold-based page switch
 */
@Page("PageListWheelTestPage")
internal class PageListWheelTestPage : Pager() {
    private var currentIndex by observable(0)
    private var wheelEventCount by observable(0)

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE) }

            Text {
                attr {
                    text("PageList Wheel Test")
                    color(Color.BLACK)
                    marginTop(20f)
                    marginLeft(16f)
                }
            }

            Text {
                attr {
                    text("index:${ctx.currentIndex} wheel:${ctx.wheelEventCount}")
                    color(0xFF666666)
                    marginTop(4f)
                    marginLeft(16f)
                    fontSize(12f)
                }
            }

            // Horizontal PageList for wheel + drag testing
            PageList {
                attr {
                    flex(1f)
                    pageDirection(true)
                    pageItemWidth(ctx.pageData.pageViewWidth)
                    pageItemHeight(ctx.pageData.pageViewHeight - 80f)
                    showScrollerIndicator(false)
                    bouncesEnable(true)
                }

                // Page 0
                List {
                    attr { backgroundColor(Color(0xFFEF5350)) }
                    Text {
                        attr {
                            text("Page 0")
                            color(Color.WHITE)
                            marginTop(20f)
                            marginLeft(16f)
                            fontSize(20f)
                            fontWeightBold()
                        }
                    }
                    for (i in 0 until 10) {
                        View {
                            attr {
                                height(48f)
                                margin(left = 16f, right = 16f, top = 8f)
                                backgroundColor(0x33FFFFFF)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("Item $i")
                                    color(Color.WHITE)
                                    fontSize(14f)
                                }
                            }
                        }
                    }
                }

                // Page 1
                List {
                    attr { backgroundColor(Color(0xFF42A5F5)) }
                    Text {
                        attr {
                            text("Page 1")
                            color(Color.WHITE)
                            marginTop(20f)
                            marginLeft(16f)
                            fontSize(20f)
                            fontWeightBold()
                        }
                    }
                    for (i in 0 until 10) {
                        View {
                            attr {
                                height(48f)
                                margin(left = 16f, right = 16f, top = 8f)
                                backgroundColor(0x33FFFFFF)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("Item $i")
                                    color(Color.WHITE)
                                    fontSize(14f)
                                }
                            }
                        }
                    }
                }

                // Page 2
                List {
                    attr { backgroundColor(Color(0xFF66BB6A)) }
                    Text {
                        attr {
                            text("Page 2")
                            color(Color.WHITE)
                            marginTop(20f)
                            marginLeft(16f)
                            fontSize(20f)
                            fontWeightBold()
                        }
                    }
                    for (i in 0 until 10) {
                        View {
                            attr {
                                height(48f)
                                margin(left = 16f, right = 16f, top = 8f)
                                backgroundColor(0x33FFFFFF)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("Item $i")
                                    color(Color.WHITE)
                                    fontSize(14f)
                                }
                            }
                        }
                    }
                }

                event {
                    pageIndexDidChanged { params ->
                        val index = (params as JSONObject).optInt("index")
                        ctx.currentIndex = index
                        ctx.wheelEventCount += 1
                    }
                }
            }
        }
    }
}
