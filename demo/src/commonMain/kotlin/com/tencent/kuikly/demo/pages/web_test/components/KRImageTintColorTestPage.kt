/*
 * Tencent is pleased to support the open source community by making KuiklyUI
 * available.
 * Copyright (C) 2025 Tencent. All rights reserved.
 * Licensed under the License of KuiklyUI;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://github.com/Tencent-TDS/KuiklyUI/blob/main/LICENSE
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.tencent.kuikly.demo.pages.web_test.components

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.directives.vfor
import com.tencent.kuikly.core.nvi.serialization.json.JSONObject
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observableList
import com.tencent.kuikly.core.views.Image
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * KRImageView tintColor 验证测试页面
 *
 * 测试覆盖：
 * 1. tintColor 列表渲染
 * 2. 复用场景下每张图片独立 filter
 */
@Page("KRImageTintColorTestPage")
internal class KRImageTintColorTestPage : Pager() {

    private var items by observableList<Int>()
    private val enableCache: JSONObject = JSONObject().put("enableCache", true)

    override fun created() {
        super.created()
        items.addAll((0 until 12).toList())
    }

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                Text {
                    attr {
                        text("KRImageTintColorTestPage")
                        fontSize(20f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                vfor({ ctx.items }) { index ->
                    View {
                        attr {
                            flexDirectionRow()
                            alignItemsCenter()
                            height(100f)
                            marginLeft(16f)
                            marginRight(16f)
                            marginTop(8f)
                            backgroundColor(Color(0xFFF5F5F5))
                            borderRadius(8f)
                        }

                        Image {
                            attr {
                                src(
                                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAASBAMAAAB/WzlGAAAAElBMVEUAAAAAAAAAAAAAAAAAAAAAAADgKxmiAAAABXRSTlMAIN/PELVZAGcAAAAkSURBVAjXYwABQTDJqCQAooSCHUAcVROCHBiFECTMhVoEtRYA6UMHzQlOjQIAAAAASUVORK5CYII=",
                                    ctx.enableCache
                                )
                                width(80f)
                                height(80f)
                                marginLeft(10f)
                                borderRadius(8f)
                                tintColor(
                                    when (index % 3) {
                                        0 -> Color.WHITE
                                        1 -> Color.RED
                                        else -> Color.GREEN
                                    }
                                )
                            }
                        }

                        View {
                            attr {
                                marginLeft(12f)
                                flex(1f)
                            }
                            Text {
                                attr {
                                    fontSize(16f)
                                    fontWeightBold()
                                    color(Color(0xFF333333))
                                    text("Item #$index")
                                }
                            }
                            Text {
                                attr {
                                    fontSize(13f)
                                    marginTop(4f)
                                    color(Color(0xFF999999))
                                    text(
                                        when (index % 3) {
                                            0 -> "tintColor: WHITE"
                                            1 -> "tintColor: RED"
                                            else -> "tintColor: GREEN"
                                        }
                                    )
                                }
                            }
                        }
                    }
                }

                View {
                    attr {
                        height(48f)
                    }
                }
            }
        }
    }
}
