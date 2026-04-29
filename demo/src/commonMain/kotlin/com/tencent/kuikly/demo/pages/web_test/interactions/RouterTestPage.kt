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
import com.tencent.kuikly.core.module.RouterModule
import com.tencent.kuikly.core.module.SharedPreferencesModule
import com.tencent.kuikly.core.nvi.serialization.json.JSONObject
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.utils.urlParams
import com.tencent.kuikly.core.views.Input
import com.tencent.kuikly.core.views.InputView
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.core.views.compose.Button

/**
 * 路由与缓存验证测试页面
 *
 * 测试覆盖：
 * 1. 输入 pageName 后执行 RouterModule.openPage
 * 2. 将最近一次输入写入 SharedPreferences
 * 3. 页面重新加载后回填上次输入值
 */
@Page("RouterTestPage", supportInLocal = true)
internal class RouterTestPage : Pager() {

    private var inputText: String = ""
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
                        text("RouterTestPage")
                        fontSize(20f)
                        fontWeightBold()
                        color(Color.BLACK)
                    }
                }

                Text {
                    attr {
                        text("输入 RouterTestPage 或 RouterTestPage&debug=true")
                        fontSize(13f)
                        color(0xFF666666)
                        marginTop(8f)
                    }
                }

                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        marginTop(16f)
                    }

                    View {
                        attr {
                            flex(1f)
                            height(44f)
                            backgroundColor(0xFFF5F5F5)
                            borderRadius(8f)
                            padding(left = 12f, right = 12f)
                        }

                        Input {
                            ref {
                                ctx.inputRef = it
                            }
                            attr {
                                flex(1f)
                                height(44f)
                                fontSize(15f)
                                color(Color.BLACK)
                                placeholder(PLACEHOLDER)
                                placeholderColor(Color(0xFF999999))
                                autofocus(true)
                            }
                            event {
                                textDidChange {
                                    ctx.inputText = it.text
                                }
                            }
                        }
                    }

                    Button {
                        attr {
                            size(88f, 44f)
                            marginLeft(12f)
                            borderRadius(8f)
                            backgroundColor(Color(0xFF1976D2))
                            titleAttr {
                                text(JUMP_TEXT)
                                fontSize(15f)
                                fontWeightBold()
                                color(Color.WHITE)
                            }
                        }
                        event {
                            click {
                                if (ctx.inputText.isEmpty()) {
                                    return@click
                                }
                                ctx.inputRef.view?.blur()
                                getPager().acquireModule<SharedPreferencesModule>(SharedPreferencesModule.MODULE_NAME)
                                    .setItem(CACHE_KEY, ctx.inputText)
                                ctx.jumpPage(ctx.inputText)
                            }
                        }
                    }
                }

                Text {
                    attr {
                        text("缓存键: $CACHE_KEY")
                        fontSize(12f)
                        color(0xFF999999)
                        marginTop(12f)
                    }
                }

                // Close page button — exercises KRRouterModule.closePage
                Button {
                    attr {
                        size(120f, 44f)
                        marginTop(16f)
                        borderRadius(8f)
                        backgroundColor(Color(0xFFE53935))
                        titleAttr {
                            text("关闭页面")
                            fontSize(15f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                    event {
                        click {
                            getPager().acquireModule<RouterModule>(RouterModule.MODULE_NAME).closePage()
                        }
                    }
                }
            }
        }
    }

    override fun viewDidLoad() {
        super.viewDidLoad()
        val cacheInputText = getPager()
            .acquireModule<SharedPreferencesModule>(SharedPreferencesModule.MODULE_NAME)
            .getItem(CACHE_KEY)
        if (cacheInputText.isNotEmpty()) {
            inputText = cacheInputText
            inputRef.view?.setText(cacheInputText)
        }
    }

    private fun jumpPage(target: String) {
        val params = urlParams("pageName=$target")
        val pageData = JSONObject()
        params.forEach {
            pageData.put(it.key, it.value)
        }
        val pageName = pageData.optString("pageName")
        acquireModule<RouterModule>(RouterModule.MODULE_NAME).openPage(pageName, pageData)
    }

    companion object {
        const val PLACEHOLDER = "输入pageName（不区分大小写）"
        const val CACHE_KEY = "router_test_last_input"
        const val JUMP_TEXT = "跳转"
    }
}
