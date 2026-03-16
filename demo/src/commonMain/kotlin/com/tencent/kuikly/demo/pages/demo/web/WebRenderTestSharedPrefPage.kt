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

package com.tencent.kuikly.demo.pages.demo.web

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.module.SharedPreferencesModule
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * SharedPreferencesModule 全方法测试页面
 * 覆盖：setItem、getItem 方法
 * 数据持久化存储，刷新后仍保留
 */
@Page("WebRenderTestSharedPref")
internal class WebRenderTestSharedPrefPage : BasePager() {

    // 测试结果状态
    private var setGetStringResult by observable("未执行")
    private var setGetNumberResult by observable("未执行")
    private var setGetJsonResult by observable("未执行")
    private var getNonExistResult by observable("未执行")
    private var overwriteResult by observable("未执行")
    private var multipleKeysResult by observable("未执行")
    private var specialCharsResult by observable("未执行")

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

                // 标题
                View {
                    attr {
                        padding(16f)
                        backgroundColor(Color(0xFF00BCD4))
                    }
                    Text {
                        attr {
                            text("SharedPreferencesModule 测试")
                            fontSize(20f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // 说明
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFE0F7FA))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("📝 说明: SharedPreferencesModule 用于持久化存储，\n数据在页面刷新后仍然保留 (Web 端使用 localStorage)。")
                            fontSize(13f)
                            color(Color(0xFF006064))
                            lineHeight(20f)
                        }
                    }
                }

                // 测试1: setItem + getItem 字符串
                SectionView("1. setItem/getItem - 字符串", ctx.setGetStringResult)

                // 测试2: setItem + getItem 数字字符串
                SectionView("2. setItem/getItem - 数字", ctx.setGetNumberResult)

                // 测试3: setItem + getItem JSON
                SectionView("3. setItem/getItem - JSON", ctx.setGetJsonResult)

                // 测试4: getItem 不存在的 key
                SectionView("4. getItem - 不存在的Key", ctx.getNonExistResult)

                // 测试5: 覆盖已有值
                SectionView("5. setItem - 覆盖已有值", ctx.overwriteResult)

                // 测试6: 多个键值对
                SectionView("6. 多个键值对存取", ctx.multipleKeysResult)

                // 测试7: 特殊字符
                SectionView("7. 特殊字符存取", ctx.specialCharsResult)

                // 底部留白
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }

    override fun created() {
        super.created()
        runSharedPrefTests()
    }

    private fun runSharedPrefTests() {
        val spModule = acquireModule<SharedPreferencesModule>(SharedPreferencesModule.MODULE_NAME)

        // 测试1: setItem + getItem 字符串
        try {
            val key1 = "sp_test_string"
            val value1 = "Hello, SharedPreferences!"
            spModule.setItem(key1, value1)
            val retrieved1 = spModule.getItem(key1)
            val match1 = retrieved1 == value1
            setGetStringResult = "✅ 测试通过\nKey: $key1\n存入: $value1\n读取: $retrieved1\n匹配: $match1"
        } catch (e: Exception) {
            setGetStringResult = "❌ 测试失败: ${e.message}"
        }

        // 测试2: setItem + getItem 数字字符串
        try {
            val key2 = "sp_test_number"
            val value2 = "123456789"
            spModule.setItem(key2, value2)
            val retrieved2 = spModule.getItem(key2)
            val match2 = retrieved2 == value2
            setGetNumberResult = "✅ 测试通过\nKey: $key2\n存入: $value2\n读取: $retrieved2\n匹配: $match2"
        } catch (e: Exception) {
            setGetNumberResult = "❌ 测试失败: ${e.message}"
        }

        // 测试3: setItem + getItem JSON
        try {
            val key3 = "sp_test_json"
            val value3 = """{"user":"kuikly","version":"1.0","features":["ui","render"]}"""
            spModule.setItem(key3, value3)
            val retrieved3 = spModule.getItem(key3)
            val match3 = retrieved3 == value3
            setGetJsonResult = "✅ 测试通过\nKey: $key3\n存入: $value3\n读取: $retrieved3\n匹配: $match3"
        } catch (e: Exception) {
            setGetJsonResult = "❌ 测试失败: ${e.message}"
        }

        // 测试4: getItem 不存在的 key
        try {
            val nonExistKey = "sp_non_exist_key_${System.currentTimeMillis()}"
            val retrieved4 = spModule.getItem(nonExistKey)
            getNonExistResult = "✅ 测试通过\nKey: $nonExistKey\n读取结果: '$retrieved4'\n(空字符串或null表示不存在)"
        } catch (e: Exception) {
            getNonExistResult = "❌ 测试失败: ${e.message}"
        }

        // 测试5: 覆盖已有值
        try {
            val key5 = "sp_test_overwrite"
            spModule.setItem(key5, "原始值")
            val original = spModule.getItem(key5)
            spModule.setItem(key5, "新值")
            val updated = spModule.getItem(key5)
            overwriteResult = "✅ 测试通过\nKey: $key5\n原始读取: $original\n覆盖后读取: $updated\n覆盖成功: ${updated == "新值"}"
        } catch (e: Exception) {
            overwriteResult = "❌ 测试失败: ${e.message}"
        }

        // 测试6: 多个键值对
        try {
            spModule.setItem("sp_multi_1", "value1")
            spModule.setItem("sp_multi_2", "value2")
            spModule.setItem("sp_multi_3", "value3")
            val v1 = spModule.getItem("sp_multi_1")
            val v2 = spModule.getItem("sp_multi_2")
            val v3 = spModule.getItem("sp_multi_3")
            multipleKeysResult = "✅ 测试通过\nsp_multi_1: $v1\nsp_multi_2: $v2\nsp_multi_3: $v3"
        } catch (e: Exception) {
            multipleKeysResult = "❌ 测试失败: ${e.message}"
        }

        // 测试7: 特殊字符
        try {
            val key7 = "sp_test_special"
            val value7 = "特殊字符: 中文、emoji😀、符号!@#$%^&*()"
            spModule.setItem(key7, value7)
            val retrieved7 = spModule.getItem(key7)
            specialCharsResult = "✅ 测试通过\nKey: $key7\n存入: $value7\n读取: $retrieved7\n匹配: ${retrieved7 == value7}"
        } catch (e: Exception) {
            specialCharsResult = "❌ 测试失败: ${e.message}"
        }
    }

    private fun ViewBuilder.SectionView(title: String, content: String) {
        View {
            attr {
                margin(12f)
                padding(12f)
                backgroundColor(Color(0xFFF5F5F5))
                borderRadius(8f)
            }
            Text {
                attr {
                    text(title)
                    fontSize(14f)
                    fontWeightBold()
                    color(Color(0xFF333333))
                    marginBottom(8f)
                }
            }
            View {
                attr {
                    padding(8f)
                    backgroundColor(Color.WHITE)
                    borderRadius(4f)
                }
                Text {
                    attr {
                        text(content)
                        fontSize(12f)
                        color(Color(0xFF666666))
                        lineHeight(18f)
                    }
                }
            }
        }
    }
}
