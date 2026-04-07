package com.tencent.kuikly.demo.pages.web_test.animations

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

@Page("PAGAnimTestPage")
internal class PAGAnimTestPage : Pager() {

    override fun body(): ViewBuilder = {
        List {
            attr {
                flex(1f)
                backgroundColor(Color.WHITE)
            }

            Text {
                attr {
                    text("PAGAnimTestPage")
                    fontSize(22f)
                    fontWeightBold()
                    color(Color.BLACK)
                    marginTop(20f)
                    marginLeft(16f)
                }
            }
        }
    }
}
