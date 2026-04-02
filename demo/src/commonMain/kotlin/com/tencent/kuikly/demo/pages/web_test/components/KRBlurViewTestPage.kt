package com.tencent.kuikly.demo.pages.web_test.components

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ColorStop
import com.tencent.kuikly.core.base.Direction
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.base.attr.ImageUri
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.Image
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

@Page("KRBlurViewTestPage")
internal class KRBlurViewTestPage : Pager() {
    override fun body(): ViewBuilder = {
        List {
            attr {
                flex(1f)
                backgroundColor(Color.WHITE)
            }
            Text {
                attr {
                    text("KRBlurViewTestPage")
                    color(Color.BLACK)
                    marginTop(20f)
                    marginLeft(16f)
                }
            }
            View {
                attr {
                    margin(left = 16f, right = 16f, top = 16f)
                    height(220f)
                    backgroundColor(0xFF0F4C81)
                    borderRadius(20f)
                    overflow(false)
                }
                Image {
                    attr {
                        absolutePositionAllZero()
                        src(ImageUri.commonAssets("penguin2.png"))
                        resizeCover()
                        blurRadius(6f)
                        maskLinearGradient(
                            Direction.TO_BOTTOM,
                            ColorStop(Color.WHITE, 0f),
                            ColorStop(Color.WHITE, 0.6f),
                            ColorStop(Color(red255 = 255, green255 = 255, blue255 = 255, 0f), 1f)
                        )
                    }
                }
            }
        }
    }
}
