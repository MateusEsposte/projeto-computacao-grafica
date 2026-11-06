#ifndef SHADER_H
#define SHADER_H

#include "includes/glad/glad.h"
#include <glm/glm.hpp>
#include <string>
#include <fstream>
#include <sstream>
#include <iostream>
#include <vector>

class Shader
{
public:
    unsigned int ID;
    // constructor generates the shader on the fly
    // ------------------------------------------------------------------------

    Shader(const char* commonPath, const char* vertexPath, const char* fragmentPath)
        : Shader(commonPath, vertexPath, std::vector<std::string>{fragmentPath})
    {
    }

    // Novo construtor: recebe vários arquivos de fragment shader.
    Shader(const char* commonPath, const char* vertexPath,
           const std::vector<std::string>& fragmentPaths)
    {
        std::string commonCode;
        std::string vertexCode;
        std::string fragmentCode;

        std::ifstream vShaderFile;
        std::ifstream cShaderFile;

        vShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);
        cShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);

        try
        {
            // Abre os arquivos comuns.
            vShaderFile.open(vertexPath);
            cShaderFile.open(commonPath);

            std::stringstream vShaderStream;
            std::stringstream cShaderStream;

            vShaderStream << vShaderFile.rdbuf();
            cShaderStream << cShaderFile.rdbuf();

            vShaderFile.close();
            cShaderFile.close();

            vertexCode = vShaderStream.str();
            commonCode = cShaderStream.str();

            // Lê e concatena os módulos na ordem recebida.
            fragmentCode = commonCode + "\n";

            for (const std::string& path : fragmentPaths)
            {
                std::ifstream fragmentFile(path);

                fragmentFile.exceptions(
                    std::ifstream::failbit | std::ifstream::badbit
                );

                std::stringstream fragmentStream;

                fragmentStream << fragmentFile.rdbuf();

                fragmentFile.close();

                fragmentCode += fragmentStream.str();
                fragmentCode += "\n";
            }
        }
        catch (const std::ifstream::failure& e)
        {
            std::cout << "ERROR::SHADER::FILE_NOT_SUCCESFULLY_READ: "
                      << e.what() << std::endl;
            return;
        }

        const char* vShaderCode = vertexCode.c_str();
        const char* fShaderCode = fragmentCode.c_str();

        // Compilação dos shaders.
        unsigned int vertex, fragment;

        vertex = glCreateShader(GL_VERTEX_SHADER);
        glShaderSource(vertex, 1, &vShaderCode, NULL);
        glCompileShader(vertex);
        checkCompileErrors(vertex, "VERTEX");

        fragment = glCreateShader(GL_FRAGMENT_SHADER);
        glShaderSource(fragment, 1, &fShaderCode, NULL);
        glCompileShader(fragment);
        checkCompileErrors(fragment, "FRAGMENT");

        // Linkagem do programa.
        ID = glCreateProgram();

        glAttachShader(ID, vertex);
        glAttachShader(ID, fragment);

        glLinkProgram(ID);
        checkCompileErrors(ID, "PROGRAM");

        glDeleteShader(vertex);
        glDeleteShader(fragment);
    }

    
    // activate the shader
    // ------------------------------------------------------------------------
    void use() 
    { 
        glUseProgram(ID); 
    }
    // utility uniform functions
    // ------------------------------------------------------------------------
    void setBool(const std::string &name, bool value) const
    {         
        glUniform1i(glGetUniformLocation(ID, name.c_str()), (int)value); 
    }
    // ------------------------------------------------------------------------
    void setInt(const std::string &name, int value) const
    { 
        glUniform1i(glGetUniformLocation(ID, name.c_str()), value); 
    }
    // ------------------------------------------------------------------------
    void setFloat(const std::string &name, float value) const
    { 
        glUniform1f(glGetUniformLocation(ID, name.c_str()), value); 
    }
    void setSampler(const std::string &name, unsigned int pos) const
    {
         glUniform1i(glGetUniformLocation(ID, name.c_str()), pos);
    }
     void setVec4(const std::string &name, double value[]) const
    {
         glUniform4f(glGetUniformLocation(ID, name.c_str()), value[0], value[1], value[2], value[3]);
    }
     void setVec2(const std::string &name, double value[]) const
    {
         glUniform2f(glGetUniformLocation(ID, name.c_str()), value[0], value[1]);
    }
     void setVec2(const std::string &name, glm::vec2 v) const
    {
         glUniform2f(glGetUniformLocation(ID, name.c_str()), v[0], v[1]);
    }

private:
    // utility function for checking shader compilation/linking errors.
    // ------------------------------------------------------------------------
    void checkCompileErrors(unsigned int shader, std::string type)
    {
        int success;
        char infoLog[1024];
        if (type != "PROGRAM")
        {
            glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
            if (!success)
            {
                glGetShaderInfoLog(shader, 1024, NULL, infoLog);
                std::cout << "ERROR::SHADER_COMPILATION_ERROR of type: " << type << "\n" << infoLog << "\n -- --------------------------------------------------- -- " << std::endl;
            }
        }
        else
        {
            glGetProgramiv(shader, GL_LINK_STATUS, &success);
            if (!success)
            {
                glGetProgramInfoLog(shader, 1024, NULL, infoLog);
                std::cout << "ERROR::PROGRAM_LINKING_ERROR of type: " << type << "\n" << infoLog << "\n -- --------------------------------------------------- -- " << std::endl;
            }
        }
    }
};
#endif

