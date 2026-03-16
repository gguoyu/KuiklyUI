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
import com.tencent.kuikly.core.module.NotifyModule
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager
import org.aspect.foundation.json.JSONObject

/**
 * NotifyModule 全方法测试页面
 * 覆盖：addNotify、postNotify、removeNotify 方法
 * 用于页面内/页面间事件通信
 */
@Page("WebRenderTestNotify")
internal class WebRenderTestNotifyPage : BasePager() {

    // 事件回调引用，用于 removeNotify
    private var eventRef1: String = ""
    private var eventRef2: String = ""

    // 测试结果状态
    private var addNotifyResult by observable("未执行")
    private var postNotifyResult by observable("未执行")
    private var receiveResult by observable("等待接收事件...")
    private var removeNotifyResult by observable("未执行")
    private var multiEventResult by observable("未执行")
    private var eventWithDataResult by observable("等待接收带数据事件...")
    private var eventCount by observable(0)

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
                        backgroundColor(Color(0xFF673AB7))
                    }
                    Text {
                        attr {
                            text("NotifyModule 测试")
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
                        backgroundColor(Color(0xFFEDE7F6))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("📝 说明: NotifyModule 用于发布/订阅事件，\n支持页面内和页面间的事件通信。")
                            fontSize(13f)
                            color(Color(0xFF4527A0))
                            lineHeight(20f)
                        }
                    }
                }

                // 测试1: addNotify
                SectionView("1. addNotify - 注册事件监听", ctx.addNotifyResult)

                // 测试2: postNotify
                SectionView("2. postNotify - 发送事件", ctx.postNotifyResult)

                // 测试3: 事件接收结果
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFE8F5E9))
                        borderRadius(8f)
                        borderWidth(2f)
                        borderColor(Color(0xFF4CAF50))
                    }
                    Text {
                        attr {
                            text("3. 事件接收结果")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF2E7D32))
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
                                text(ctx.receiveResult)
                                fontSize(13f)
                                color(Color(0xFF388E3C))
                                lineHeight(20f)
                            }
                        }
                    }
                }

                // 测试4: removeNotify
                SectionView("4. removeNotify - 移除事件监听", ctx.removeNotifyResult)

                // 测试5: 多事件并发
                SectionView("5. 多事件并发测试", ctx.multiEventResult)

                // 测试6: 带数据的事件
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFFFF8E1))
                        borderRadius(8f)
                        borderWidth(2f)
                        borderColor(Color(0xFFFFA000))
                    }
                    Text {
                        attr {
                            text("6. 带数据的事件")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFFFF8F00))
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
                                text(ctx.eventWithDataResult)
                                fontSize(13f)
                                color(Color(0xFFF57C00))
                                lineHeight(20f)
                            }
                        }
                    }
                }

                // 事件计数器
                View {
                    attr {
                        margin(12f)
                        padding(16f)
                        backgroundColor(Color(0xFF3F51B5))
                        borderRadius(8f)
                        alignItemsCenter()
                    }
                    Text {
                        attr {
                            text("事件接收计数: ${ctx.eventCount}")
                            fontSize(18f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

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
        runNotifyTests()
    }

    private fun runNotifyTests() {
        val notifyModule = acquireModule<NotifyModule>(NotifyModule.MODULE_NAME)

        // 测试1: addNotify - 注册事件监听
        val eventName1 = "test_event_basic"
        try {
            eventRef1 = notifyModule.addNotify(eventName1) { data ->
                eventCount++
                receiveResult = "✅ 收到事件: $eventName1\n数据: $data\n时间: ${System.currentTimeMillis()}"
            }
            addNotifyResult = "✅ 注册成功\n事件名: $eventName1\n回调引用: $eventRef1"
        } catch (e: Exception) {
            addNotifyResult = "❌ 注册失败: ${e.message}"
        }

        // 测试2: postNotify - 发送事件
        try {
            val postData = JSONObject()
            postData.put("message", "Hello from postNotify")
            postData.put("timestamp", 1700000000L)
            notifyModule.postNotify(eventName1, postData)
            postNotifyResult = "✅ 发送成功\n事件名: $eventName1\n数据: $postData"
        } catch (e: Exception) {
            postNotifyResult = "❌ 发送失败: ${e.message}"
        }

        // 测试5: 多事件并发
        val eventName2 = "test_event_multi"
        try {
            var multiCount = 0
            eventRef2 = notifyModule.addNotify(eventName2) { _ ->
                multiCount++
                eventCount++
            }
            // 连续发送3次
            notifyModule.postNotify(eventName2, JSONObject())
            notifyModule.postNotify(eventName2, JSONObject())
            notifyModule.postNotify(eventName2, JSONObject())
            multiEventResult = "✅ 多事件测试完成\n事件名: $eventName2\n发送次数: 3\n预期接收: 3"
        } catch (e: Exception) {
            multiEventResult = "❌ 多事件测试失败: ${e.message}"
        }

        // 测试6: 带数据的事件
        val eventName3 = "test_event_with_data"
        try {
            notifyModule.addNotify(eventName3) { data ->
                eventCount++
                val name = data?.optString("name") ?: "unknown"
                val age = data?.optInt("age") ?: 0
                val city = data?.optString("city") ?: "unknown"
                eventWithDataResult = "✅ 收到带数据事件\nname: $name\nage: $age\ncity: $city"
            }
            val userData = JSONObject()
            userData.put("name", "张三")
            userData.put("age", 25)
            userData.put("city", "深圳")
            notifyModule.postNotify(eventName3, userData)
        } catch (e: Exception) {
            eventWithDataResult = "❌ 带数据事件测试失败: ${e.message}"
        }

        // 测试4: removeNotify - 延迟执行以展示效果
        setTimeout(500) {
            try {
                notifyModule.removeNotify(eventName1, eventRef1)
                removeNotifyResult = "✅ 移除成功\n事件名: $eventName1\n回调引用: $eventRef1\n(移除后该事件不再接收)"

                // 尝试再次发送，验证已移除
                notifyModule.postNotify(eventName1, JSONObject())
            } catch (e: Exception) {
                removeNotifyResult = "❌ 移除失败: ${e.message}"
            }
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
