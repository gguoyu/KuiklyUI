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
import com.tencent.kuikly.core.module.MemoryCacheModule
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * MemoryCacheModule 全方法测试页面
 * 覆盖：setObject 方法 (注: 内存缓存主要用于运行时数据存储)
 */
@Page("WebRenderTestMemoryCache")
internal class WebRenderTestMemoryCachePage : BasePager() {

    // 测试结果状态
    private var setStringResult by observable("未执行")
    private var setNumberResult by observable("未执行")
    private var setObjectResult by observable("未执行")
    private var setMultipleResult by observable("未执行")
    private var overwriteResult by observable("未执行")

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
                        backgroundColor(Color(0xFFFF5722))
                    }
                    Text {
                        attr {
                            text("MemoryCacheModule 测试")
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
                        backgroundColor(Color(0xFFFFF3E0))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("📝 说明: MemoryCacheModule 用于运行时内存缓存，\n数据在页面刷新后会丢失。")
                            fontSize(13f)
                            color(Color(0xFFE65100))
                            lineHeight(20f)
                        }
                    }
                }

                // 测试1: 存储字符串
                SectionView("1. setObject - 字符串", ctx.setStringResult)

                // 测试2: 存储数字
                SectionView("2. setObject - 数字", ctx.setNumberResult)

                // 测试3: 存储JSON对象
                SectionView("3. setObject - JSON对象", ctx.setObjectResult)

                // 测试4: 存储多个键值对
                SectionView("4. setObject - 多个键值对", ctx.setMultipleResult)

                // 测试5: 覆盖已有值
                SectionView("5. setObject - 覆盖已有值", ctx.overwriteResult)

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
        runMemoryCacheTests()
    }

    private fun runMemoryCacheTests() {
        val cacheModule = acquireModule<MemoryCacheModule>(MemoryCacheModule.MODULE_NAME)

        // 测试1: 存储字符串
        try {
            val key1 = "testStringKey"
            val value1 = "Hello, Kuikly Memory Cache!"
            cacheModule.setObject(key1, value1)
            setStringResult = "✅ 存储成功\nKey: $key1\nValue: $value1"
        } catch (e: Exception) {
            setStringResult = "❌ 存储失败: ${e.message}"
        }

        // 测试2: 存储数字
        try {
            val key2 = "testNumberKey"
            val value2 = "12345.67"
            cacheModule.setObject(key2, value2)
            setNumberResult = "✅ 存储成功\nKey: $key2\nValue: $value2"
        } catch (e: Exception) {
            setNumberResult = "❌ 存储失败: ${e.message}"
        }

        // 测试3: 存储JSON对象
        try {
            val key3 = "testObjectKey"
            val value3 = """{"name":"张三","age":25,"city":"深圳"}"""
            cacheModule.setObject(key3, value3)
            setObjectResult = "✅ 存储成功\nKey: $key3\nValue: $value3"
        } catch (e: Exception) {
            setObjectResult = "❌ 存储失败: ${e.message}"
        }

        // 测试4: 存储多个键值对
        try {
            cacheModule.setObject("multiKey1", "value1")
            cacheModule.setObject("multiKey2", "value2")
            cacheModule.setObject("multiKey3", "value3")
            setMultipleResult = "✅ 存储成功\nmultiKey1: value1\nmultiKey2: value2\nmultiKey3: value3"
        } catch (e: Exception) {
            setMultipleResult = "❌ 存储失败: ${e.message}"
        }

        // 测试5: 覆盖已有值
        try {
            val overwriteKey = "overwriteKey"
            cacheModule.setObject(overwriteKey, "原始值")
            cacheModule.setObject(overwriteKey, "新值")
            overwriteResult = "✅ 覆盖成功\nKey: $overwriteKey\n原始值 -> 新值"
        } catch (e: Exception) {
            overwriteResult = "❌ 覆盖失败: ${e.message}"
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
                        fontSize(13f)
                        color(Color(0xFF666666))
                        lineHeight(20f)
                    }
                }
            }
        }
    }
}
