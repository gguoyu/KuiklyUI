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
import com.tencent.kuikly.core.timer.setTimeout
import com.tencent.kuikly.core.views.Input
import com.tencent.kuikly.core.views.InputView
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * 光标能力验证测试页面
 *
 * 测试覆盖：
 * 1. 输入框基础输入
 * 2. cursorIndex 查询
 * 3. setCursorIndex 光标定位
 */
@Page("CursorTestPage")
internal class CursorTestPage : Pager() {

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
                    padding(all = 16f)
                }

                Text {
                    attr {
                        text("CursorTestPage")
                        fontSize(20f)
                        fontWeightBold()
                        color(Color.BLACK)
                    }
                }

                Text {
                    attr {
                        text("输入后会自动将光标设置到第 3 位")
                        fontSize(13f)
                        color(0xFF666666)
                        marginTop(8f)
                    }
                }

                View {
                    attr {
                        marginTop(16f)
                        height(48f)
                        borderRadius(8f)
                        backgroundColor(0xFFF5F5F5)
                        padding(left = 12f, right = 12f)
                    }

                    Input {
                        ref {
                            ctx.inputRef = it
                        }
                        attr {
                            flex(1f)
                            height(48f)
                            color(Color.BLACK)
                            fontSize(16f)
                            placeholder("请输入文本验证光标")
                            placeholderColor(Color(0xFF999999))
                        }
                    }
                }
            }
        }
    }

    override fun created() {
        super.created()
        reportCursorIndex()
        applyCursorIndex()
    }

    private fun reportCursorIndex() {
        setTimeout(pagerId, 2000) {
            inputRef.view?.cursorIndex {
                KLog.i("CR7", "indec: $it")
                reportCursorIndex()
            }
        }
    }

    private fun applyCursorIndex() {
        setTimeout(pagerId, 7000) {
            inputRef.view?.setCursorIndex(3)
            applyCursorIndex()
        }
    }
}
