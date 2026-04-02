package com.tencent.kuikly.demo.pages.web_test.components

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.Hover
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text

@Page("KRHoverViewTestPage")
internal class KRHoverViewTestPage : Pager() {
    override fun body(): ViewBuilder = {
        List {
            attr {
                flex(1f)
                backgroundColor(0xFFF0F4F8)
            }
            Text {
                attr {
                    text("KRHoverViewTestPage")
                    color(Color.BLACK)
                    marginTop(20f)
                    marginLeft(16f)
                }
            }
            Text {
                attr {
                    text("Scroll content")
                    marginTop(100f)
                    height(1200f)
                    marginLeft(16f)
                }
            }
            Hover {
                attr {
                    absolutePosition(top = 120f, left = 16f, right = 16f)
                    height(48f)
                    backgroundColor(0xFFE53935)
                }
            }
            Hover {
                attr {
                    absolutePosition(top = 188f, left = 48f, right = 48f)
                    height(40f)
                    backgroundColor(0xFF1E88E5)
                }
            }
        }
    }
}
