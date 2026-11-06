cmake_minimum_required(VERSION 3.16)

set (CMAKE_CXX_STANDARD 17)

project(Math3)

add_executable(Math3 stb_image/stb_image.cpp Shader.h glad.c Math3.cpp)

target_link_libraries(Math3 GL dl glfw)
