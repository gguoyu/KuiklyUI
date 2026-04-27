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

package com.tencent.kuikly.demo.pages.web_test.modules

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.module.SharedPreferencesModule
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * SharedPreferences 模块测试页面
 *
 * 测试覆盖：
 * 1. setString / getString — GET_ITEM / SET_ITEM via web localStorage
 * 2. setInt / getInt
 * 3. setFloat / getFloat
 * 4. 覆写同 key 的数据 (update)
 * 5. 读取不存在的 key (returns empty string)
 */
@Page("SharedPreferencesTestPage")
internal class SharedPreferencesTestPage : Pager() {

    companion object {
        private const val KEY_STRING = "kuikly_test_str"
        private const val KEY_INT = "kuikly_test_int"
        private const val KEY_FLOAT = "kuikly_test_float"
        private const val KEY_MISSING = "kuikly_test_missing_xyz"
    }

    private var stringResult by observable("string-result: pending")
    private var intResult by observable("int-result: pending")
    private var floatResult by observable("float-result: pending")
    private var updateResult by observable("update-result: pending")
    private var missingResult by observable("missing-result: pending")

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE) }

            List {
                attr { flex(1f) }

                Text {
                    attr {
                        text("SharedPreferences 模块测试")
                        fontSize(18f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // === setString / getString ===
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        backgroundColor(Color(0xFF1976D2))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            val sp = ctx.acquireModule<SharedPreferencesModule>(SharedPreferencesModule.MODULE_NAME)
                            sp.setString(KEY_STRING, "hello-kuikly")
                            val value = sp.getString(KEY_STRING)
                            ctx.stringResult = "string-result: $value"
                        }
                    }
                    Text {
                        attr {
                            text("setString / getString")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                Text {
                    attr {
                        text(ctx.stringResult)
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF333333)
                    }
                }

                // === setInt / getInt ===
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        backgroundColor(Color(0xFF388E3C))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            val sp = ctx.acquireModule<SharedPreferencesModule>(SharedPreferencesModule.MODULE_NAME)
                            sp.setInt(KEY_INT, 42)
                            val value = sp.getInt(KEY_INT)
                            ctx.intResult = "int-result: $value"
                        }
                    }
                    Text {
                        attr {
                            text("setInt / getInt")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                Text {
                    attr {
                        text(ctx.intResult)
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF333333)
                    }
                }

                // === setFloat / getFloat ===
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        backgroundColor(Color(0xFFE64A19))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            val sp = ctx.acquireModule<SharedPreferencesModule>(SharedPreferencesModule.MODULE_NAME)
                            sp.setFloat(KEY_FLOAT, 3.14f)
                            val value = sp.getFloat(KEY_FLOAT)
                            ctx.floatResult = "float-result: $value"
                        }
                    }
                    Text {
                        attr {
                            text("setFloat / getFloat")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                Text {
                    attr {
                        text(ctx.floatResult)
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF333333)
                    }
                }

                // === update existing key ===
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        backgroundColor(Color(0xFF7B1FA2))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            val sp = ctx.acquireModule<SharedPreferencesModule>(SharedPreferencesModule.MODULE_NAME)
                            sp.setString(KEY_STRING, "updated-value")
                            val value = sp.getString(KEY_STRING)
                            ctx.updateResult = "update-result: $value"
                        }
                    }
                    Text {
                        attr {
                            text("update (overwrite string)")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                Text {
                    attr {
                        text(ctx.updateResult)
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF333333)
                    }
                }

                // === get missing key ===
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        backgroundColor(Color(0xFF00796B))
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            val sp = ctx.acquireModule<SharedPreferencesModule>(SharedPreferencesModule.MODULE_NAME)
                            val value = sp.getString(KEY_MISSING)
                            ctx.missingResult = if (value.isEmpty()) "missing-result: empty" else "missing-result: $value"
                        }
                    }
                    Text {
                        attr {
                            text("getMissing")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                Text {
                    attr {
                        text(ctx.missingResult)
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF333333)
                    }
                }

                View { attr { height(50f) } }
            }
        }
    }
}
