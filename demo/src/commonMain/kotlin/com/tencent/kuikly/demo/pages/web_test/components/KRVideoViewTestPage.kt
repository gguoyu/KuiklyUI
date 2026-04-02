package com.tencent.kuikly.demo.pages.web_test.components

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.Video
import com.tencent.kuikly.core.views.VideoPlayControl

@Page("KRVideoViewTestPage")
internal class KRVideoViewTestPage : Pager() {
    override fun body(): ViewBuilder = {
        List {
            attr {
                flex(1f)
                backgroundColor(Color.BLACK)
            }
            Text {
                attr {
                    text("KRVideoViewTestPage")
                    color(Color.WHITE)
                    marginTop(20f)
                    marginLeft(16f)
                }
            }
            Video {
                attr {
                    src("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4")
                    height(220f)
                    margin(left = 16f, right = 16f, top = 16f)
                    playControl(VideoPlayControl.PLAY)
                }
            }
        }
    }
}
