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
import com.tencent.kuikly.core.base.Border
import com.tencent.kuikly.core.base.BorderStyle
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.ActivityIndicator
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * KRActivityIndicatorView 渲染验证测试页面
 *
 * 测试覆盖：
 * 1. 白色与灰色两种样式
 * 2. 默认 20x20 尺寸
 * 3. 旋转动画存在
 */
@Page("KRActivityIndicatorTestPage")
internal class KRActivityIndicatorTestPage : Pager() {

    override fun body(): ViewBuilder {
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
                        text("KRActivityIndicatorTestPage")
                        fontSize(20f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                Text {
                    attr {
                        text("1. 白色样式")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        backgroundColor(Color.BLACK)
                        height(56f)
                        margin(left = 16f, right = 16f, top = 12f)
                        borderRadius(8f)
                        allCenter()
                    }
                    ActivityIndicator {
                        attr {
                        }
                    }
                }

                Text {
                    attr {
                        text("2. 灰色样式")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        backgroundColor(Color.WHITE)
                        height(56f)
                        margin(left = 16f, right = 16f, top = 12f)
                        borderRadius(8f)
                        border(Border(1f, BorderStyle.SOLID, Color(0xFFE0E0E0)))
                        allCenter()
                    }
                    ActivityIndicator {
                        attr {
                            isGrayStyle(true)
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
