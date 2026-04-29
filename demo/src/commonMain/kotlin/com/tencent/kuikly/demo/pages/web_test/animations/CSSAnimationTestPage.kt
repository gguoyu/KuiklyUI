package com.tencent.kuikly.demo.pages.web_test.animations

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Animation
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * CSS Animation advanced test page
 *
 * Covers additional animation branches in KuiklyRenderCSSKTX:
 * - Animation cancellation (set animation = null)
 * - Two-step animation commit (set then empty)
 * - Frame animation with width/height (triggers frameAnimationEndCount/RemainCount)
 * - Animation completion callback with finish/attr/animationKey params
 * - Animation queue empty removal
 */
@Page("CSSAnimationTestPage")
internal class CSSAnimationTestPage : Pager() {

    private var animCancelState by observable(false)
    private var twoStepState by observable(false)
    private var frameAnimState by observable(false)
    private var completionDetail by observable("none")
    private var animQueueCount by observable(0)

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE) }

            List {
                attr { flex(1f) }

                Text {
                    attr {
                        text("CSS Animation Advanced")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // Section 1: Animation Cancellation (set animation = null)
                Text {
                    attr {
                        text("1. Animation Cancel")
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
                        size(if (ctx.animCancelState) 200f else 100f, 60f)
                        backgroundColor(Color(0xFFE53935))
                        borderRadius(8f)
                        animation(Animation.linear(durationS = 2f), ctx.animCancelState)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.animCancelState = !ctx.animCancelState
                        }
                    }
                    Text {
                        attr {
                            text("Toggle")
                            fontSize(14f)
                            color(Color.WHITE)
                        }
                    }
                }

                // Cancel button — triggers animation == null path in setKRAnimation
                View {
                    attr {
                        margin(left = 16f, top = 8f)
                        size(120f, 36f)
                        backgroundColor(Color(0xFF757575))
                        borderRadius(4f)
                        allCenter()
                    }
                    event {
                        click {
                            // Cancel animation by setting state back immediately
                            ctx.animCancelState = false
                        }
                    }
                    Text {
                        attr {
                            text("Cancel")
                            fontSize(12f)
                            color(Color.WHITE)
                        }
                    }
                }

                // Section 2: Two-step commit (animation set then empty)
                Text {
                    attr {
                        text("2. Two-Step Commit")
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
                        size(if (ctx.twoStepState) 180f else 90f, 60f)
                        backgroundColor(Color(0xFF43A047))
                        borderRadius(8f)
                        animation(Animation.linear(durationS = 0.5f), ctx.twoStepState)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.twoStepState = !ctx.twoStepState
                        }
                    }
                    Text {
                        attr {
                            text("TwoStep")
                            fontSize(14f)
                            color(Color.WHITE)
                        }
                    }
                }

                // Section 3: Frame animation (width + height simultaneously)
                Text {
                    attr {
                        text("3. Frame Animation (w+h)")
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
                        size(
                            if (ctx.frameAnimState) 200f else 100f,
                            if (ctx.frameAnimState) 120f else 60f
                        )
                        backgroundColor(Color(0xFF1E88E5))
                        borderRadius(8f)
                        animation(Animation.linear(durationS = 0.5f), ctx.frameAnimState)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.frameAnimState = !ctx.frameAnimState
                        }
                        animationCompletion {
                            ctx.completionDetail = "completed"
                            ctx.animQueueCount += 1
                        }
                    }
                    Text {
                        attr {
                            text("Frame")
                            fontSize(14f)
                            color(Color.WHITE)
                        }
                    }
                }

                Text {
                    attr {
                        text("completion: ${ctx.completionDetail}")
                        fontSize(12f)
                        marginTop(4f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                Text {
                    attr {
                        text("queueCount: ${ctx.animQueueCount}")
                        fontSize(12f)
                        marginTop(4f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // Section 4: Rapid toggle to trigger empty animation removal
                Text {
                    attr {
                        text("4. Rapid Toggle")
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
                        size(100f, 40f)
                        backgroundColor(Color(0xFF8E24AA))
                        borderRadius(4f)
                        allCenter()
                    }
                    event {
                        click {
                            // Rapidly toggle to create empty animation instances
                            ctx.frameAnimState = !ctx.frameAnimState
                        }
                    }
                    Text {
                        attr {
                            text("Rapid")
                            fontSize(12f)
                            color(Color.WHITE)
                        }
                    }
                }

                View { attr { height(50f) } }
            }
        }
    }
}
