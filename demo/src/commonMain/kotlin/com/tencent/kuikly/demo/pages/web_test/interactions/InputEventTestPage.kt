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

package com.tencent.kuikly.demo.pages.web_test.interactions

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.base.ViewRef
import com.tencent.kuikly.core.log.KLog
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.Input
import com.tencent.kuikly.core.views.InputView
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Input 事件与样式验证测试页面
 *
 * 测试覆盖：
 * 1. autofocus
 * 2. 输入框样式与 placeholder / enterkeyhint
 * 3. focus / blur / textDidChange 日志
 */
@Page("InputEventTestPage")
internal class InputEventTestPage : Pager() {

    private lateinit var inputRef: ViewRef<InputView>

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
                        text("InputEventTestPage")
                        fontSize(20f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                Text {
                    attr {
                        text("点击上下留白区域可触发 blur")
                        fontSize(13f)
                        marginTop(8f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                View {
                    attr {
                        height(120f)
                        margin(left = 16f, right = 16f, top = 16f)
                        backgroundColor(Color.BLACK)
                        borderRadius(8f)
                    }
                    event {
                        click { ctx.inputRef.view?.blur() }
                    }
                }

                Input {
                    ref {
                        ctx.inputRef = it
                    }
                    attr {
                        margin(left = 16f, right = 16f, top = 16f)
                        maxTextLength(20)
                        height(120f)
                        fontSize(30f)
                        fontWeightBold()
                        returnKeyTypeNext()
                        placeholder("我是placeholder")
                        placeholderColor(Color.YELLOW)
                        color(Color.BLACK)
                        autofocus(true)
                        backgroundColor(Color.RED)
                    }
                    event {
                        textDidChange {
                            KLog.i("InputEventTestPage", "textDidChange$it")
                        }
                        inputBlur {
                            KLog.i("InputEventTestPage", "inputBlur$it")
                        }
                        inputFocus {
                            KLog.i("InputEventTestPage", "inputFocus$it")
                        }
                    }
                }

                View {
                    attr {
                        height(120f)
                        margin(all = 16f)
                        backgroundColor(Color.GREEN)
                        borderRadius(8f)
                    }
                    event {
                        click { ctx.inputRef.view?.blur() }
                    }
                }
            }
        }
    }
}
