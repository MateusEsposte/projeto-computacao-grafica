cmake_minimum_required(VERSION 3.16)

project(Math3)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(Math3
    stb_image/stb_image.cpp
    Shader.h
    glad.c
    Math3.cpp
)

target_include_directories(Math3 PRIVATE
    ${CMAKE_SOURCE_DIR}/includes
)

target_link_libraries(Math3 GL dl glfw)