package com.tencent.kuikly.demo.pages.web_test.interactions

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Pan cross-boundary and mouse longPress test page
 *
 * Covers EventProcessor PC paths:
 * - Pan initiated on element, mouse moves outside (PCPanEventHandler)
 * - Mouse-based longPress (mousedown -> timer -> mouseup/leave)
 * - KRView bindMouseEvents for pan inside ListView
 */
@Page("PanCrossBoundaryTestPage")
internal class PanCrossBoundaryTestPage : Pager() {
    private var panState by observable("pan-idle")
    private var longPressCount by observable(0)
    private var panCount by observable(0)

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE) }

            List {
                attr { flex(1f) }

                Text {
                    attr {
                        text("Pan & LongPress Test")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // Section 1: Pan area (outside-boundary drag)
                Text {
                    attr {
                        text("1. Pan Area (drag outside)")
                        fontSize(14f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, top = 8f)
                        size(300f, 120f)
                        backgroundColor(Color(0xFF1976D2))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        pan { params ->
                            val state = params.state
                            ctx.panState = "pan-$state"
                            if (state == "start") {
                                ctx.panCount += 1
                            }
                        }
                    }
                    Text {
                        attr {
                            text("${ctx.panState} count:${ctx.panCount}")
                            fontSize(14f)
                            color(Color.WHITE)
                        }
                    }
                }

                // Section 2: LongPress area
                Text {
                    attr {
                        text("2. LongPress Area")
                        fontSize(14f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, top = 8f)
                        size(300f, 80f)
                        backgroundColor(Color(0xFF388E3C))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        longPress {
                            ctx.longPressCount += 1
                        }
                    }
                    Text {
                        attr {
                            text("lp-count:${ctx.longPressCount}")
                            fontSize(14f)
                            color(Color.WHITE)
                        }
                    }
                }

                // Section 3: Pan inside ListView (scroll conflict)
                Text {
                    attr {
                        text("3. Pan in ListView")
                        fontSize(14f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                List {
                    attr {
                        height(200f)
                        margin(left = 16f, right = 16f, top = 8f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    for (i in 0 until 5) {
                        View {
                            attr {
                                height(48f)
                                margin(left = 8f, right = 8f, top = 4f)
                                backgroundColor(Color.WHITE)
                                allCenter()
                            }
                            event {
                                pan { params ->
                                    val state = params.state
                                    if (state == "start") {
                                        ctx.panCount += 1
                                    }
                                }
                            }
                            Text {
                                attr {
                                    text("List Item $i")
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
